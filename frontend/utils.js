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

        // Read body once — never mix response.json() + response.text() (same stream throws "already read").
        const raw = await response.text();

        // Handle 401 (token expired/invalid)
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/student-login.html';
            return null;
        }

        let parsed;
        try {
            parsed =
                raw === undefined || raw === null || raw.trim() === ''
                    ? undefined
                    : JSON.parse(raw);
        } catch {
            parsed = '__NOT_JSON__';
        }

        if (!response.ok) {
            const errorBody =
                parsed !== '__NOT_JSON__' && typeof parsed === 'object' && parsed !== null
                    ? parsed
                    : { msg: raw || response.statusText || 'API Error' };
            const error = new Error(errorBody.msg || errorBody.error || 'API Error');
            error.status = response.status;
            error.body = errorBody;
            throw error;
        }

        if (parsed === '__NOT_JSON__') {
            throw new Error(raw ? raw.slice(0, 500) : 'Invalid JSON response');
        }

        return parsed === undefined ? null : parsed;
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

/** Human-readable slot from `<input type="time">` value (HH:MM) and class count — e.g. "9:00 AM - 11:00 AM" */
function format12HourSlotRange(startHHMM, numClasses) {
    const n = parseInt(numClasses, 10);
    const hours = Number.isFinite(n) && n > 0 ? n : 1;
    if (!startHHMM || typeof startHHMM !== 'string') return '';
    const clock = startHHMM.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!clock) return '';
    const h = parseInt(clock[1], 10);
    const m = parseInt(clock[2], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return '';

    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + hours * 60);

    const fmt = (d) => {
        let hr = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const ampm = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12;
        hr = hr ? hr : 12;
        return `${hr}:${min} ${ampm}`;
    };
    return `${fmt(startDate)} - ${fmt(endDate)}`;
}

/** Label for a row in `attendance`: new range strings stay as-is; legacy `HH:MM` entries use numClasses */
function resolveAttendanceSlotLabel(storedTime, numClasses) {
    if (!storedTime) return '';
    const s = String(storedTime).trim();
    if (/\b(AM|PM)\s*-\s*.+\b(AM|PM)/i.test(s)) return s;
    const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m) return format12HourSlotRange(s, numClasses || 1);
    return s;
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
