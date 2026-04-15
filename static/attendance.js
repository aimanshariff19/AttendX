/* -------- GLOBAL VARS -------- */
const subjectId = localStorage.getItem('current_subject_id');
const subjectName = localStorage.getItem('current_subject_name') || "Subject";
const deptName = localStorage.getItem('current_dept_name') || "Department";

let currentStudentList = [];

/* -------- UI HELPERS -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "-";
}

function setBtnLoading(btn, text = "Loading") {
    if (!btn || btn.classList.contains("loading")) return;
    btn.dataset.original = btn.innerHTML;
    btn.classList.add("loading");
    btn.innerHTML = `${text} <span class="btn-spinner"></span>`;
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

function showError(msg, isSuccess = false) {
    let box = document.getElementById("errorBox");
    if (!box) {
        box = document.createElement("div");
        box.id = "errorBox";
        box.style.position = "fixed";
        box.style.top = "20px";
        box.style.left = "50%";
        box.style.transform = "translateX(-50%)";
        box.style.padding = "10px 16px";
        box.style.borderRadius = "8px";
        box.style.fontSize = "13px";
        box.style.zIndex = "999";
        box.style.color = "white";
        document.body.appendChild(box);
    }

    box.style.background = isSuccess ? "#22c55e" : "#ef4444";
    box.innerText = msg;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 2500);
}

/* -------- TIME LOGIC -------- */
function updateCurrentTime() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;

    const el = document.getElementById("currentTime");
    if (el) el.value = `${h}:${m} ${ampm}`;
}

function calculateTimeRange() {
    const start = document.getElementById("classTime")?.value;
    const num = parseInt(document.getElementById("numClasses")?.value);

    if (!start || !num) return;

    let [h, m] = start.split(":").map(Number);
    let startDate = new Date();
    startDate.setHours(h, m);

    let endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + num * 60);

    const format12 = (d) => {
        let hr = d.getHours();
        const min = String(d.getMinutes()).padStart(2, "0");
        const ampm = hr >= 12 ? "PM" : "AM";
        hr = hr % 12;
        hr = hr ? hr : 12;
        return `${hr}:${min} ${ampm}`;
    };

    const el = document.getElementById("timeRange");
    if (el) el.innerText = `${format12(startDate)} - ${format12(endDate)}`;
}

/* -------- 🚀 FETCH STUDENTS -------- */
async function loadStudents() {
    const table = document.getElementById("studentRows");
    if (!table) {
        console.error("❌ studentRows not found");
        return;
    }

    try {
        const response = await fetch('/api/students', {
            credentials: 'include'
        });

        const data = await response.json();
        console.log("RESPONSE DATA:", data);

        if (!response.ok) throw new Error(data.error);

        currentStudentList = Array.isArray(data.students) ? data.students : [];
        console.log("FINAL STUDENT LIST:", currentStudentList);

        /* 🔥 FIX: FORCE CLEAR TABLE (REAL BUG FIX) */
        while (table.firstChild) {
            table.removeChild(table.firstChild);
        }

        if (currentStudentList.length === 0) {
            table.innerHTML = `<tr><td colspan="4" style="text-align:center;">No students found</td></tr>`;
            return;
        }

        currentStudentList.forEach((student) => {
            let row = document.createElement("tr");

            row.innerHTML = `
                <td>${student.usn}</td>
                <td>${student.name}</td>
                <td>--</td>
                <td>
                    <button class="status-btn present active" data-id="${student.id}" onclick="toggleStatus(this)">
                        Present
                    </button>
                </td>
            `;

            table.appendChild(row);
        });

        console.log("ROWS ADDED:", table.children.length);

    } catch (err) {
        console.error("Error fetching students:", err);
        table.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Failed to load students.</td></tr>`;
    }
}

/* -------- TOGGLE -------- */
function toggleStatus(btn) {
    const row = btn.closest("tr");
    const isPresent = btn.classList.contains("present");

    btn.classList.remove("present", "absent", "active");

    if (isPresent) {
        btn.classList.add("absent", "active");
        btn.innerText = "Absent";
        row.style.background = "rgba(239,68,68,0.08)";
    } else {
        btn.classList.add("present", "active");
        btn.innerText = "Present";
        row.style.background = "rgba(34,197,94,0.08)";
    }
}

function markAll(isPresent, event) {
    let btn = event?.target || document.activeElement;
    setBtnLoading(btn, isPresent ? "Marking Present" : "Marking Absent");

    setTimeout(() => {
        document.querySelectorAll("#studentRows tr").forEach(row => {
            const b = row.querySelector(".status-btn");
            if (!b) return;

            b.classList.remove("present", "absent", "active");

            if (isPresent) {
                b.classList.add("present", "active");
                b.innerText = "Present";
                row.style.background = "rgba(34,197,94,0.08)";
            } else {
                b.classList.add("absent", "active");
                b.innerText = "Absent";
                row.style.background = "rgba(239,68,68,0.08)";
            }
        });
        resetBtn(btn);
    }, 400);
}

/* -------- SUBMIT -------- */
async function submitAttendance(btn) {
    const date = document.getElementById("date")?.value;
    const time = document.getElementById("classTime")?.value;
    const numClasses = parseInt(document.getElementById("numClasses")?.value || "1");

    if (!time) {
        triggerShake(document.getElementById("classTime"));
        showError("Please select a Start Time");
        return;
    }

    setBtnLoading(btn, "Submitting...");

    try {
        let [h, m] = time.split(":").map(Number);
        let endDate = new Date();
        endDate.setHours(h, m, 0, 0);
        endDate.setMinutes(endDate.getMinutes() + (numClasses * 60));

        const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

        const rows = document.querySelectorAll("#studentRows tr");
        const attendanceRecords = [];

        rows.forEach(row => {
            const statusBtn = row.querySelector(".status-btn");
            if (statusBtn) {
                attendanceRecords.push({
                    student_id: statusBtn.getAttribute("data-id"),
                    status: statusBtn.classList.contains("present") ? "Present" : "Absent"
                });
            }
        });

        if (attendanceRecords.length === 0) throw new Error("No students to mark.");

        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_id: parseInt(subjectId),
                date,
                start_time: time,
                end_time: endTimeStr,
                records: attendanceRecords
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        showError("Attendance Saved Successfully!", true);

        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 1500);

    } catch (err) {
        console.error("Submit Error:", err);
        showError(err.message || "Failed to save to database.");
        resetBtn(btn);
    }
}

/* -------- NAVIGATION -------- */
function goBack(btn) {
    if (btn && btn.target) btn = btn.target;
    setBtnLoading(btn, "Going");
    setTimeout(() => window.location.href = "/dashboard", 250);
}

function editAttendance(btn) {
    if (btn && btn.target) btn = btn.target;
    setBtnLoading(btn, "Opening");
    setTimeout(() => window.location.href = "/edit-attendance", 400);
}

/* -------- INIT -------- */
window.onload = function () {
    setText("subject", subjectName);
    setText("department", deptName);

    document.getElementById("program").parentElement.style.display = "none";
    document.getElementById("sem").parentElement.style.display = "none";
    document.getElementById("section").parentElement.style.display = "none";

    const dateInput = document.getElementById("date");
    const today = new Date().toISOString().split("T")[0];
    if (dateInput) {
        dateInput.value = today;
        dateInput.setAttribute("readonly", true);
    }

    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange);
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange);

    setTimeout(() => {
        loadStudents();
    }, 300);
};