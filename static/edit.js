/* -------- GLOBAL VARS -------- */
const subjectId = localStorage.getItem('current_subject_id');
const subjectName = localStorage.getItem('current_subject_name') || "Subject";
const deptName = localStorage.getItem('current_dept_name') || "Department";

let pastSessions = [];
let currentSessionId = null;

// UI Elements
const dateDropdown = document.getElementById("attendanceDate");
const timeDropdown = document.getElementById("timeSelect");
const table = document.getElementById("studentRows");
const updateBtn = document.querySelector("button[onclick='updateAttendance(event)']");

/* -------- UI HELPERS -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "-";
}

function setBtnLoading(btn, text = "Loading...") {
    if (!btn || btn.classList.contains("loading")) return;
    btn.dataset.original = btn.innerHTML;
    btn.classList.add("loading");
    btn.innerHTML = `<span>${text}</span> <span class="btn-spinner"></span>`;
}

function resetBtn(btn) {
    if (!btn) return;
    btn.classList.remove("loading");
    if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
}

function triggerShake(el) {
    if (!el) return;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 400);
}

function showToast(msg, type = "error") {
    let box = document.getElementById("toastBox");
    if (!box) {
        box = document.createElement("div");
        box.id = "toastBox";
        box.style.position = "fixed";
        box.style.top = "20px";
        box.style.left = "50%";
        box.style.transform = "translateX(-50%)";
        box.style.color = "white";
        box.style.padding = "10px 16px";
        box.style.borderRadius = "8px";
        box.style.fontSize = "13px";
        box.style.zIndex = "999";
        document.body.appendChild(box);
    }
    box.style.background = (type === "success") ? "#16a34a" : "#ef4444";
    box.innerText = msg;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 2500);
}

/* -------- ✅ FIXED ERROR FUNCTION -------- */
function showFieldError(input, message) {
    if (!input) return;

    const parent = input.parentElement;

    const old = parent.querySelector(".field-error");
    if (old) old.remove();

    const err = document.createElement("div");
    err.className = "field-error";
    err.innerText = message;

    parent.appendChild(err);

    input.classList.add("input-error");

    // 🔥 shake full container
    triggerShake(parent);

    setTimeout(() => {
        input.classList.remove("input-error");
        err.remove();
    }, 2000);
}

/* -------- TIME FORMATTER -------- */
function formatTimeRange(startTime, endTime) {
    if (!startTime || !endTime) return "--";
    const format = (t) => {
        let [h, m] = t.split(":");
        h = parseInt(h);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };
    return `${format(startTime)} - ${format(endTime)}`;
}

function checkEnableUpdate() {
    if (!updateBtn) return;
    if (dateDropdown.value && timeDropdown.value) {
        updateBtn.disabled = false;
        updateBtn.style.opacity = "1";
    } else {
        updateBtn.disabled = true;
        updateBtn.style.opacity = "0.5";
    }
}

/* -------- FETCH SESSIONS -------- */
async function fetchPastSessions() {
    try {
        const response = await fetch(`/api/sessions/${subjectId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        pastSessions = data.sessions || [];

        const uniqueDates = [...new Set(pastSessions.map(s => s.session_date))];
        dateDropdown.innerHTML = '<option value="">Select Date</option>';

        uniqueDates.forEach(date => {
            let opt = document.createElement('option');
            opt.value = date;
            opt.textContent = date;
            dateDropdown.appendChild(opt);
        });

    } catch (err) {
        console.error("Error fetching sessions:", err);
        showToast("Failed to load past sessions", "error");
    }
}

function loadTimesForDate() {
    const selectedDate = dateDropdown.value;
    timeDropdown.innerHTML = "";

    if (!selectedDate) {
        timeDropdown.innerHTML = "<option value=''>Select date first</option>";
        checkEnableUpdate();
        return;
    }

    const sessionsForDate = pastSessions.filter(s => s.session_date === selectedDate);

    timeDropdown.innerHTML = "<option value=''>Select Time Slot</option>";

    sessionsForDate.forEach(session => {
        let opt = document.createElement('option');
        opt.value = session.id;
        opt.textContent = formatTimeRange(session.start_time, session.end_time);
        timeDropdown.appendChild(opt);
    });

    checkEnableUpdate();
}

/* -------- LOAD ATTENDANCE -------- */
async function loadAttendance(event) {
    const btn = event?.currentTarget; // ✅ FIXED
    currentSessionId = timeDropdown.value;

    if (!dateDropdown.value || !currentSessionId) {
        if (!dateDropdown.value) showFieldError(dateDropdown, "Select Date");
        if (!currentSessionId) showFieldError(timeDropdown, "Select Time Slot");
        return;
    }

    setBtnLoading(btn, "Loading...");

    try {
        const response = await fetch(`/api/attendance/${currentSessionId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        const records = data.records;
        table.innerHTML = "";

        if (!records || records.length === 0) {
            table.innerHTML = `<tr><td colspan="6" style="text-align:center;">No records found.</td></tr>`;
            resetBtn(btn);
            return;
        }

        records.sort((a, b) => a.students.usn.localeCompare(b.students.usn));

        records.forEach(record => {
            const student = record.students;

            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.usn}</td>
                <td>${student.name}</td>
                <td>--</td>
                <td>
                    <button class="status-btn ${record.status === "Present" ? "present" : "absent"} active" 
                        data-record-id="${record.id}" 
                        data-student-id="${student.id}"
                        onclick="toggleStatus(this)">
                        ${record.status}
                    </button>
                </td>
                <td>
                    <input type="text" placeholder="Optional reason..." 
                        style="width:100%; padding:4px; border-radius:4px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:white; font-size:11px;">
                </td>
            `;
            table.appendChild(row);
        });

        showToast("Records Loaded", "success");

    } catch (err) {
        console.error("Load Error:", err);
        showToast("Failed to load records.", "error");
    } finally {
        resetBtn(btn);
    }
}

/* -------- TOGGLE -------- */
function toggleStatus(btn) {
    const isPresent = btn.classList.contains("present");
    btn.classList.remove("present", "absent");

    if (isPresent) {
        btn.classList.add("absent");
        btn.innerText = "Absent";
    } else {
        btn.classList.add("present");
        btn.innerText = "Present";
    }
}

/* -------- BULK -------- */
function markAll(isPresent) {
    document.querySelectorAll("#studentRows tr").forEach(row => {
        const b = row.querySelector(".status-btn");
        if (!b) return;

        b.classList.remove("present", "absent", "active");

        if (isPresent) {
            b.classList.add("present", "active");
            b.innerText = "Present";
        } else {
            b.classList.add("absent", "active");
            b.innerText = "Absent";
        }
    });
}

/* -------- UPDATE -------- */
async function updateAttendance(event) {
    if (!currentSessionId) return;

    const btn = event?.currentTarget; // optional

    setBtnLoading(btn, "Updating...");

    try {
        const rows = document.querySelectorAll("#studentRows tr");
        const updates = [];

        rows.forEach(row => {
            const statusBtn = row.querySelector(".status-btn");
            if (statusBtn) {
                updates.push({
                    id: statusBtn.getAttribute("data-record-id"),
                    session_id: currentSessionId,
                    student_id: statusBtn.getAttribute("data-student-id"),
                    status: statusBtn.classList.contains("present") ? "Present" : "Absent"
                });
            }
        });

        const response = await fetch('/api/attendance/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error);

        showToast("Attendance Updated Successfully!", "success");

        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1500);

    } catch (err) {
        console.error("Update Error:", err);
        showToast("Failed to update database.", "error");
        resetBtn(btn);
    }
}

/* -------- INIT -------- */
dateDropdown.addEventListener("change", loadTimesForDate);
timeDropdown.addEventListener("change", checkEnableUpdate);

window.onload = () => {
    document.getElementById("program").parentElement.style.display = "none";
    document.getElementById("sem").parentElement.style.display = "none";
    document.getElementById("section").parentElement.style.display = "none";

    setText("subject", subjectName);
    setText("department", deptName);

    fetchPastSessions();
};