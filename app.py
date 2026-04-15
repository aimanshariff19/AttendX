from flask import Flask, request, redirect, render_template, make_response
from supabase import create_client, Client
import jwt
import datetime
import os

app = Flask(__name__)

@app.after_request
def add_header(response):
    # This tells the browser: "Never save this page in your history cache!"
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# ==========================================
# 1. CONFIGURATION & DATABASE CONNECTION
# ==========================================
# Replace these with your actual Supabase URL and Anon Key!
SUPABASE_URL = "https://bqjdqojgeeieipccjxqp.supabase.co"
SUPABASE_KEY = "sb_publishable_FBatg12NnzG9NkZSioHJEg_tAcMRvzH"
# Make this a long, random string. Never share it!
JWT_SECRET = "attendx_super_secret_key_2026" 

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 2. HELPER FUNCTION: THE BOUNCER
# ==========================================
def verify_token(required_role=None):
    """Checks the cookie, decodes the JWT, and verifies the role."""
    token = request.cookies.get('attendx_token')
    if not token:
        return None
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_role = decoded.get('role')

        # Check if they have the right badge
        if required_role:
            # 🔥 GOD-MODE FIX: If the door requires Faculty, but the user is an HOD, let them in!
            if required_role == 'faculty' and user_role == 'hod':
                pass 
            elif user_role != required_role:
                return None
                
        return decoded
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
    
# ==========================================
# 3. PAGE ROUTES (Delivering the HTML)
# ==========================================

@app.route('/', methods=['GET'])
def home():
    # If already logged in as faculty, skip login and go to dashboard
    user_data = verify_token(required_role='faculty')
    if user_data:
        return redirect('/dashboard')
    return render_template('index.html')

@app.route('/student-login', methods=['GET'])
def student_login_page():
    user_data = verify_token(required_role='student')
    if user_data:
        return redirect('/student-dashboard')
    return render_template('student-login.html')

@app.route('/hod-login', methods=['GET'])
def hod_login_page():
    user_data = verify_token(required_role='hod')
    if user_data:
        return redirect('/hod-dashboard')
    return render_template('hod-login.html')

# --- PROTECTED DASHBOARD ROUTES ---

@app.route('/dashboard', methods=['GET'])
def faculty_dashboard():
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return redirect('/')
    
    try:
        # 1. Fetch the faculty profile
        response = supabase.table('faculty').select('*').eq('id', user_data['user_id']).single().execute()
        faculty_profile = response.data

        # 2. Fetch all class assignments
        session_res = supabase.table('class_sessions').select(
            'id, subject_id, subjects(name, code)'
        ).eq('faculty_id', faculty_profile['id']).execute()
        
        sessions = session_res.data or []
        section_count = len(sessions) # Count total sections
        
        # 3. Deduplicate the subjects for the cards
        unique_subjects = {}
        session_ids = []
        for session in sessions:
            session_ids.append(session['id'])
            subj_id = session.get('subject_id')
            subj_data = session.get('subjects')
            
            if subj_id and subj_data and subj_id not in unique_subjects:
                unique_subjects[subj_id] = {
                    'id': subj_id,
                    'name': subj_data.get('name'),
                    'code': subj_data.get('code')
                }
        
        subjects_list = list(unique_subjects.values())

        # 4. Count unique students across all their classes
        student_count = 0
        if session_ids:
            # We look at attendance records tied to this faculty's sessions to find unique students
            att_res = supabase.table('attendance_records').select('student_id').in_('session_id', session_ids).execute()
            if att_res.data:
                # Using a 'set' automatically removes duplicate students!
                unique_students = set(record['student_id'] for record in att_res.data)
                student_count = len(unique_students)

        # 5. Hand EVERYTHING to the HTML
        return render_template(
            'dashboard.html', 
            faculty=faculty_profile, 
            subjects=subjects_list,
            section_count=section_count,
            student_count=student_count
        )
        
    except Exception as e:
        print(f"Dashboard Error: {e}")
        return "Server Error", 500

@app.route('/student-dashboard', methods=['GET'])
def student_dashboard():
    user_data = verify_token(required_role='student')
    if not user_data:
        return redirect('/student-login')
    
    try:
        # 1. Fetch the student profile
        response = supabase.table('students').select('*').eq('id', user_data['user_id']).single().execute()
        student_profile = response.data

        # 2. Fetch the Department Name
        dept_res = supabase.table('departments').select('name').eq('id', student_profile['department_id']).single().execute()
        dept_name = dept_res.data['name'] if dept_res.data else "Department"

        # 3. Fetch ALL attendance records & subjects for this student
        att_res = supabase.table('attendance_records').select(
            'status, class_sessions(id, subject_id, subjects(name, code))'
        ).eq('student_id', student_profile['id']).execute()
        attendance_data = att_res.data

        # 4. Pass EVERYTHING securely into the HTML
        return render_template(
            'student-dashboard.html', 
            student=student_profile, 
            dept_name=dept_name, 
            attendance_data=attendance_data
        )
        
    except Exception as e:
        print(f"Dashboard Error: {e}")
        return "Error loading dashboard data", 500

@app.route('/hod-dashboard', methods=['GET'])
def hod_dashboard():
    user_data = verify_token(required_role='hod')
    if not user_data:
        return redirect('/hod-login')
    
    try:
        dept_id = user_data['department_id']

        # 1. HOD Profile & Dept Name
        hod_res = supabase.table('faculty').select('name').eq('id', user_data['user_id']).single().execute()
        dept_res = supabase.table('departments').select('name').eq('id', dept_id).single().execute()

        hod_name = hod_res.data['name'] if hod_res.data else "HOD"
        dept_name = dept_res.data['name'] if dept_res.data else "Department"

        # 2. Calculate Aggregated Stats
        fac_res = supabase.table('faculty').select('id').eq('department_id', dept_id).execute()
        stu_res = supabase.table('students').select('id').eq('department_id', dept_id).execute()
        sess_res = supabase.table('class_sessions').select('subject_id, id').eq('department_id', dept_id).execute()

        sessions = sess_res.data or []
        unique_courses = len(set(s['subject_id'] for s in sessions))

        stats = {
            'faculty': len(fac_res.data) if fac_res.data else 0,
            'students': len(stu_res.data) if stu_res.data else 0,
            'courses': unique_courses,
            'sections': len(sessions)
        }

        # 3 🔥 FETCH SUBJECTS
        sub_res = supabase.table('class_sessions').select(
            'subject_id, semester, section, subjects(name, code), faculty(name)'
        ).eq('department_id', dept_id).execute()
        
        print("SUBJECT RAW DATA:", sub_res.data)

        subjects_map = {}

        for s in sub_res.data or []:
            if not s.get('subjects'):
                continue

            key = s['subject_id']

            if key not in subjects_map:
                subjects_map[key] = {
                    'id': key,
                    'name': s['subjects']['name'],
                    'code': s['subjects']['code'],
                    'faculty': s['faculty']['name'] if s.get('faculty') else "Unknown",
                    'sem': s.get('semester'),
                    'section': s.get('section'),
                    'dept': dept_name,
                    'program': "BTech"
                }

        subjects_list = list(subjects_map.values())

        # ✅ FIXED INDENTATION HERE
        return render_template(
            'hod-dashboard.html', 
            hod_name=hod_name, 
            dept_name=dept_name, 
            stats=stats, 
            subjects=subjects_list
        )
        
    except Exception as e:
        print(f"HOD Dashboard Error: {e}")
    return "Server Error", 500
        

@app.route('/hod-students', methods=['GET'])
def hod_students_page():
    user_data = verify_token(required_role='hod')
    if not user_data:
        return redirect('/hod-login')
    
    try:
        dept_id = user_data['department_id']
        # Fetch students and their attendance history in one massive query!
        students_res = supabase.table('students').select(
            'id, usn, name, current_semester, attendance_records(status)'
        ).eq('department_id', dept_id).order('current_semester').order('usn').execute()

        return render_template('hod-students.html', students=students_res.data)
    except Exception as e:
        print(f"HOD Students Error: {e}")
        return "Server Error", 500

# --- ATTENDANCE ROUTES ---
@app.route('/attendance', methods=['GET'])
def take_attendance_page():
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return redirect('/')
    return render_template('attendance.html')

@app.route('/edit-attendance', methods=['GET'])
def edit_attendance_page():
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return redirect('/')
    return render_template('edit-attendance.html')

# ==========================================
# 4. API ROUTES (Handling the Form Submissions)
# ==========================================

@app.route('/api/login/faculty', methods=['POST'])
def api_faculty_login():
    username = request.form.get('username')
    password = request.form.get('password')

    try:
        response = supabase.rpc('verify_faculty_login', {
            'p_username': username,
            'p_password': password
        }).execute()

        if not response.data:
           return redirect('/?error=invalid')

        faculty = response.data[0]

        payload = {
            'user_id': faculty['id'],
            'role': 'faculty',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        resp = make_response(redirect('/dashboard'))
        resp.set_cookie('attendx_token', token, httponly=True, samesite='Lax')
        return resp

    except Exception as e:
        print(f"Login Error: {e}")
        return "Server Error", 500

@app.route('/api/login/student', methods=['POST'])
def api_student_login():
    username = request.form.get('username')
    password = request.form.get('password')

    try:
        # Call your secure Supabase function
        response = supabase.rpc('verify_student_login', {
            'p_username': username,
            'p_password': password
        }).execute()

        if not response.data:
            return "Invalid Credentials", 401

        student = response.data[0]

        # Generate the JWT (The ID Card)
        payload = {
            'user_id': student['id'],
            'usn': student['usn'],
            'role': 'student',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        # Create the response and attach the Secure Cookie
        resp = make_response(redirect('/student-dashboard'))
        resp.set_cookie('attendx_token', token, httponly=True, samesite='Lax')
        return resp

    except Exception as e:
        print(f"Login Error: {e}")
        return "Server Error", 500

@app.route('/api/login/hod', methods=['POST'])
def api_hod_login():
    username = request.form.get('username')
    password = request.form.get('password')

    # 👉 ADD THESE TWO PRINT STATEMENTS RIGHT HERE:
    print(f"\n--- DEBUGGING HOD LOGIN ---")
    print(f"Username received from HTML: {username}")
    print(f"Password received from HTML: {password}")
    print(f"---------------------------\n")

    try:
        response = supabase.rpc('verify_hod_login', {
            'p_username': username,
            'p_password': password
        }).execute()

        if not response.data:
            return "Invalid Credentials", 401

        hod = response.data[0]

        payload = {
            'user_id': hod['id'],
            'department_id': hod['department_id'],
            'role': 'hod',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        resp = make_response(redirect('/hod-dashboard'))
        resp.set_cookie('attendx_token', token, httponly=True, samesite='Lax')
        return resp

    except Exception as e:
        print(f"Login Error: {e}")
        return "Server Error", 500
    

# ==========================================
# CHANGE PASSWORD ROUTES
# ==========================================
@app.route('/change-password', methods=['GET'])
def change_password_page():
    # Only allow logged-in users to see this page
    user_data = verify_token()
    if not user_data:
        return redirect('/')
    return render_template('change-password.html')

@app.route('/api/change-password', methods=['POST'])
def api_change_password():
    # 1. Verify who is asking to change their password
    user_data = verify_token()
    if not user_data:
        return {"error": "Unauthorized"}, 401

    # 2. Get the JSON data sent from Javascript
    data = request.get_json()
    old_pass = data.get('oldPass')
    new_pass = data.get('newPass')

    try:
        # 3. Call the secure Supabase SQL function we created earlier
        if user_data['role'] == 'student':
            response = supabase.rpc('change_student_password', {
                'p_student_id': user_data['user_id'],
                'p_old_password': old_pass,
                'p_new_password': new_pass
            }).execute()

            # The SQL function returns TRUE if successful, FALSE if old password was wrong
            if response.data is True:
                return {"success": True}, 200
            else:
                return {"error": "Incorrect old password"}, 400
        else:
            return {"error": "HOD password change not configured yet"}, 400

    except Exception as e:
        print(f"Password Change Error: {e}")
        return {"error": "Database error"}, 500

# ==========================================
# ATTENDANCE API ROUTES
# ==========================================
@app.route('/api/students', methods=['GET'])
def api_get_students():
    # 1. Security Check
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return {"error": "Unauthorized"}, 401
    
    try:
        # 2. Find out which department this faculty belongs to
        fac_res = supabase.table('faculty').select('department_id').eq('id', user_data['user_id']).single().execute()
        dept_id = fac_res.data['department_id']

        # 3. Fetch the students for that specific department securely!
        stu_res = supabase.table('students').select('id, usn, name').eq('department_id', dept_id).order('usn').execute()
        
        return {"students": stu_res.data}, 200
    except Exception as e:
        print(f"Error fetching students: {e}")
        return {"error": "Database error"}, 500

@app.route('/api/attendance', methods=['POST'])
def api_submit_attendance():
    # 1. Security Check
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return {"error": "Unauthorized"}, 401

    # 2. Get the data sent from Javascript
    data = request.get_json()
    subject_id = data.get('subject_id')
    date = data.get('date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    records = data.get('records') # This is the list of students and their Present/Absent status

    try:
        fac_res = supabase.table('faculty').select('department_id').eq('id', user_data['user_id']).single().execute()
        dept_id = fac_res.data['department_id']

        # 3. CREATE THE CLASS SESSION
        session_data = {
            'faculty_id': user_data['user_id'],
            'department_id': dept_id,
            'subject_id': subject_id,
            'session_date': date,
            'start_time': start_time,
            'end_time': end_time,
            'session_type': 'Lecture'
        }
        sess_res = supabase.table('class_sessions').insert(session_data).execute()
        new_session_id = sess_res.data[0]['id']

        # 4. BULK INSERT THE ATTENDANCE RECORDS
        attendance_inserts = []
        for rec in records:
            attendance_inserts.append({
                'session_id': new_session_id,
                'student_id': rec['student_id'],
                'status': rec['status']
            })
        
        supabase.table('attendance_records').insert(attendance_inserts).execute()

        return {"success": True}, 200
    
    except Exception as e:
        print(f"Submit Attendance Error: {e}")
        return {"error": "Failed to save attendance"}, 500

# 🔥 FIX: Changed <int:subject_id> to <string:subject_id>
@app.route('/api/sessions/<string:subject_id>', methods=['GET'])
def api_get_sessions(subject_id):
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return {"error": "Unauthorized"}, 401
    
    try:
        res = supabase.table('class_sessions').select('id, session_date, start_time, end_time') \
            .eq('faculty_id', user_data['user_id']) \
            .eq('subject_id', subject_id) \
            .order('session_date', desc=True).order('start_time', desc=True).execute()
        return {"sessions": res.data}, 200
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return {"error": "Failed to fetch sessions"}, 500

# 🔥 FIX: Changed <int:session_id> to <string:session_id>
@app.route('/api/attendance/<string:session_id>', methods=['GET'])
def api_get_attendance_records(session_id):
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return {"error": "Unauthorized"}, 401
    
    try:
        res = supabase.table('attendance_records').select(
            'id, status, students(id, usn, name)'
        ).eq('session_id', session_id).execute()
        
        return {"records": res.data}, 200
    except Exception as e:
        print(f"Error fetching attendance records: {e}")
        return {"error": "Failed to fetch records"}, 500
    
@app.route('/api/attendance/update', methods=['POST'])
def api_update_attendance():
    user_data = verify_token(required_role='faculty')
    if not user_data:
        return {"error": "Unauthorized"}, 401
    
    data = request.get_json()
    updates = data.get('updates')
    
    try:
        # Supabase upsert automatically updates rows that already exist based on their ID
        supabase.table('attendance_records').upsert(updates).execute()
        return {"success": True}, 200
    except Exception as e:
        print(f"Error updating attendance: {e}")
        return {"error": "Failed to update database"}, 500
# ==========================================
# 5. LOGOUT ROUTE
# ==========================================
@app.route('/logout')
def logout():
    # Figure out where to redirect based on their current role before deleting the cookie
    user_data = verify_token()
    redirect_url = '/'
    if user_data:
        if user_data.get('role') == 'student':
            redirect_url = '/student-login'
        elif user_data.get('role') == 'hod':
            redirect_url = '/hod-login'
        elif user_data.get('role') == 'faculty':
            redirect_url = '/' # Faculty logs in at the root index!

    resp = make_response(redirect(redirect_url))
    resp.set_cookie('attendx_token', '', expires=0) # Destroys the cookie
    return resp

if __name__ == '__main__':
    app.run(debug=True, port=5000)