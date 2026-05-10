const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabase');
const { attendanceSlotDisplay } = require('../attendance_time_format');

/** Persist `attendance.time` as "9:00 AM - 11:00 AM" even if the client sends `09:00` only (cached/old UI). */
function normalizeAttendanceSlotTime(rawTime, numClasses) {
    const nc =
        Number.isFinite(Number(numClasses)) && Number(numClasses) > 0
            ? Number(numClasses)
            : 1;
    if (rawTime === undefined || rawTime === null) return rawTime;
    return attendanceSlotDisplay(String(rawTime).trim(), nc);
}

function checkSupabase(res) {
    if (!supabase) {
        return res.status(500).json({ msg: 'Supabase is not configured' });
    }
    return null;
}

function buildAbsenceMessages(student, course, consecutiveDays) {
    const name = student?.name || student?.id || 'Student';
    const className = `${course.department} ${course.program} Sem ${course.sem} Sec ${course.section}`;

    return {
        en: `${name} has been absent for ${consecutiveDays} consecutive days in ${course.subject} (${className}).`,
        kn: `${name} ಅವರು ${course.subject} (${className}) ವಿಷಯದಲ್ಲಿ ನಿರಂತರ ${consecutiveDays} ದಿನ ಗೈರಾಗಿದ್ದಾರೆ.`,
        hi: `${name} ${course.subject} (${className}) में लगातार ${consecutiveDays} दिनों से अनुपस्थित है।`
    };
}

function latestConsecutiveAbsenceDays(attendances, studentId) {
    const byDate = new Map();

    (attendances || []).forEach(day => {
        const rec = (day.records || []).find(r => r.studentId === studentId);
        if (!rec) return;
        byDate.set(day.date, rec.status);
    });

    const dates = [...byDate.keys()].sort().reverse();
    let count = 0;

    for (const date of dates) {
        if (byDate.get(date) === 'Absent') {
            count++;
        } else {
            break;
        }
    }

    return count;
}

async function getClassCoordinator(course) {
    const { data, error } = await supabase
        .from('class_coordinators')
        .select('*')
        .match({
            department: course.department,
            program: course.program,
            sem: course.sem,
            section: course.section
        })
        .maybeSingle();

    if (error) {
        console.error(error.message);
        return null;
    }

    return data;
}

async function getUser(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error(error.message);
        return null;
    }

    return data;
}

async function insertAlert({ userId, recipientRole, phone, title, type, message, messages, channels }) {
    const { error } = await supabase
        .from('notifications')
        .insert({
            studentId: userId,
            user_id: userId,
            recipient_role: recipientRole,
            phone,
            title,
            type,
            message,
            messages,
            channels
        });

    if (error) {
        console.error(error.message);
    }
}

async function sendAbsenceAlerts(course, records, attendances) {
    const coordinator = await getClassCoordinator(course);
    const faculty = await getUser(course.facultyId);

    for (const [studentId, record] of Object.entries(records || {})) {
        if (record.status !== 'Absent') continue;

        const consecutiveDays = latestConsecutiveAbsenceDays(attendances, studentId);
        if (consecutiveDays !== 2 && consecutiveDays < 4) continue;

        const student = await getUser(studentId);
        const messages = buildAbsenceMessages(student, course, consecutiveDays);
        const isCritical = consecutiveDays >= 4;
        const title = isCritical ? 'Critical Attendance Alert' : 'Attendance Warning';
        const type = isCritical ? 'critical' : 'warning';
        const channels = isCritical ? ['app', 'sms', 'whatsapp'] : ['app'];

        await insertAlert({
            userId: studentId,
            recipientRole: 'student',
            phone: student?.phone || null,
            title,
            type,
            message: messages.en,
            messages,
            channels
        });

        if (coordinator) {
            await insertAlert({
                userId: coordinator.user_id || coordinator.id || null,
                recipientRole: 'class_coordinator',
                phone: coordinator.phone || null,
                title,
                type,
                message: messages.en,
                messages,
                channels
            });
        }

        await insertAlert({
            userId: studentId,
            recipientRole: 'parent',
            phone: student?.parentPhone || null,
            title,
            type,
            message: messages.en,
            messages,
            channels: ['sms', 'whatsapp']
        });

        if (isCritical) {
            await insertAlert({
                userId: faculty?.id || course.facultyId,
                recipientRole: 'subject_faculty',
                phone: faculty?.phone || null,
                title,
                type,
                message: messages.en,
                messages,
                channels
            });
        }
    }
}

// @route   GET api/faculty/courses
// @desc    Get assigned courses for logged in faculty
router.get('/courses', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('*')
            .eq('facultyId', req.user.id);

        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/faculty/students
// @desc    Get students for a specific course/class
router.get('/students', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { department, program, sem, section } = req.query;
    try {
        let query = supabase.from('users').select('*').eq('role', 'student');

        if (department) query = query.eq('department', department);
        if (program) query = query.eq('program', program);
        if (sem) query = query.eq('sem', sem);
        if (section) query = query.eq('section', section);

        const { data: students, error } = await query;

        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/faculty/attendance
// @desc    Submit attendance
router.post('/attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time, numClasses, records } = req.body;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) {
            return res.status(403).json({ msg: 'Not authorized for this course' });
        }

        const slotTime = normalizeAttendanceSlotTime(time, numClasses);

        const { data: dayRows, error: dayFetchError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .eq('date', date);

        if (dayFetchError) {
            console.error(dayFetchError.message);
            return res.status(500).send('Server Error');
        }

        const existingAttendance = (dayRows || []).find(
            (row) =>
                normalizeAttendanceSlotTime(row.time, row.numClasses ?? row.num_classes) ===
                slotTime
        );

        if (existingAttendance) {
            return res.status(400).json({ msg: 'Attendance already marked for this slot' });
        }

        const attendancePayload = {
            courseId: course.id,
            date,
            time: slotTime,
            numClasses: numClasses || 1,
            records: Object.keys(records).map(usn => ({
                studentId: usn,
                status: records[usn].status,
                reason: records[usn].reason || ''
            }))
        };

        const { data: attendance, error: insertError } = await supabase
            .from('attendance')
            .insert(attendancePayload)
            .select()
            .single();

        if (insertError) {
            console.error(insertError.message);
            return res.status(500).send('Server Error');
        }

        const { data: allAttendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (attendanceError) {
            console.error(attendanceError.message);
            return res.status(500).send('Server Error');
        }

        await sendAbsenceAlerts(course, records, allAttendance);

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/faculty/attendance
// @desc    Get attendance for edit
router.get('/attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time } = req.query;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) return res.status(404).json({ msg: 'Course not found' });

        let query = supabase.from('attendance').select('*').eq('courseId', course.id);

        if (date) query = query.eq('date', date);
        if (time) query = query.eq('time', time);

        const { data: attendances, error } = await query;
        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        res.json(attendances);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/faculty/attendance
// @desc    Update attendance
router.put('/attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time, records } = req.body;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) return res.status(403).json({ msg: 'Not authorized for this course' });

        const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .match({ courseId: course.id, date, time })
            .single();

        if (attendanceError || !attendance) {
            return res.status(404).json({ msg: 'Attendance record not found' });
        }

        const updatedRecords = Object.keys(records).map(usn => ({
            studentId: usn,
            status: records[usn].status,
            reason: records[usn].reason || ''
        }));

        const { data: updatedAttendance, error: updateError } = await supabase
            .from('attendance')
            .update({ records: updatedRecords })
            .match({ courseId: course.id, date, time })
            .select()
            .single();

        if (updateError) {
            console.error(updateError.message);
            return res.status(500).send('Server Error');
        }

        const { data: allAttendance, error: attendanceListError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (attendanceListError) {
            console.error(attendanceListError.message);
            return res.status(500).send('Server Error');
        }

        await sendAbsenceAlerts(course, records, allAttendance);

        res.json(updatedAttendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
