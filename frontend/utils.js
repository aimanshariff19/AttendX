// ===== BACKEND API CONFIG =====
const API_BASE = '/api';

// ===== HELPER: API CALL WITH TIMEOUT =====
async function apiCall(endpoint, method = 'GET', body = null, timeoutMs = 5000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            signal: controller.signal
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        clearTimeout(timeoutId);

        // Handle 401 (token expired/invalid)
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/student-login.html';
            return null;
        }

        if (!response.ok) {
            let errorBody = {};
            try {
                errorBody = await response.json();
            } catch (parseError) {
                errorBody = { msg: await response.text() };
            }
            const error = new Error(errorBody.msg || errorBody.error || 'API Error');
            error.status = response.status;
            error.body = errorBody;
            throw error;
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('API Timeout:', endpoint);
            throw new Error('Request timeout - server not responding');
        }
        console.error('API Error:', error);
        throw error;
    }
}

async function apiFetch(endpoint, options = {}) {
    let body = options.body || null;
    if (typeof body === 'string') {
        body = JSON.parse(body);
    }

    return await apiCall(
        endpoint,
        options.method || 'GET',
        body,
        options.timeoutMs || 8000
    );
}

function buildQuery(params) {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            search.set(key, value);
        }
    });
    return search.toString();
}

function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

async function requireAuth(role) {
    try {
        const user = await apiFetch('/auth/me');
        if (!user || (role && user.role !== role)) {
            window.location.href = role === 'hod'
                ? 'hod-login.html'
                : role === 'faculty'
                    ? 'faculty-login.html'
                    : 'student-login.html';
            return null;
        }

        localStorage.setItem('user_id', user.id);
        localStorage.setItem('user_name', user.name || '');
        localStorage.setItem('user_role', user.role || '');
        return user;
    } catch (error) {
        window.location.href = role === 'hod'
            ? 'hod-login.html'
            : role === 'faculty'
                ? 'faculty-login.html'
                : 'student-login.html';
        return null;
    }
}

async function logoutBackend() {
    return await apiFetch('/auth/logout', { method: 'POST' });
}

// ===== AUTH: LOGIN =====
async function login(userId, password, role = 'student') {
    try {
        const data = await apiCall('/auth/login', 'POST', { id: userId, password, role }, 8000);
        if (data && data.user) {
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('user_role', data.user.role);
            return data.user;
        }
        return null;
    } catch (error) {
        throw error;
    }
}

// ===== AUTH: LOGOUT =====
async function logout() {
    await apiCall('/auth/logout', 'POST');
    localStorage.clear();
}

// ===== AUTH: CHANGE PASSWORD =====
async function changePassword(oldPassword, newPassword) {
    return await apiCall('/auth/password', 'PUT', { oldPassword, newPassword });
}

// ===== FACULTY: GET COURSES =====
async function getFacultyCourses() {
    return await apiCall('/faculty/courses');
}

// ===== FACULTY: GET ATTENDANCE =====
async function getFacultyAttendance(courseId) {
    return await apiCall(`/faculty/attendance?courseId=${courseId}`);
}

// ===== FACULTY: MARK ATTENDANCE =====
async function markAttendance(courseId, studentId, status = true, hours = 1) {
    return await apiCall('/faculty/attendance', 'POST', { courseId, studentId, status, hours });
}

// ===== STUDENT: GET DASHBOARD =====
async function getStudentDashboard() {
    return await apiCall('/student/stats');
}

// ===== STUDENT: GET ATTENDANCE =====
async function getStudentAttendance(courseId) {
    return await apiCall(`/student/attendance/${courseId}`);
}

// ===== HOD: GET COURSES =====
async function getHodCourses() {
    return await apiCall('/hod/courses');
}

// ===== HOD: GET STUDENTS =====
async function getHodStudents(courseId) {
    return await apiCall(`/hod/students?courseId=${courseId}`);
}

// ===== HOD: GET DEFAULTERS =====
async function getDefaulters() {
    return await apiCall('/hod/defaulters');
}

// ===== EXPORT: CSV =====
async function exportCsv(courseId) {
    try {
        const response = await fetch(`${API_BASE}/export/csv?courseId=${courseId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export Error:', error);
        showError('Failed to export data');
    }
}

// ===== UI HELPERS =====
function showError(message) {
    const errorEl = document.querySelector('.error-text');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    alert(message);
}

function redirectTo(url) {
    window.location.href = url;
}

function goHome() {
    console.log("Navigating to portal...");
    window.location.assign(window.location.origin + '/');
}
