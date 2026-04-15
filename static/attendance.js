/* -------- GLOBAL VARS -------- */
const subjectId = localStorage.getItem('current_subject_id');
const subjectName = localStorage.getItem('current_subject_name') || "Subject";
const deptName = localStorage.getItem('current_dept_name') || "Department"; // kept (not removed)

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

/* -------- 🚀 NEW: FETCH FACULTY INFO (DEPT FROM DB) -------- */
async function loadFacultyInfo() {
    try {
        const res = await fetch('/api/faculty-info', {
            credentials: 'include'
        });

        const data = await res.json();

        if (res.ok && data.department) {
            setText("department", data.department);
        } else {
            setText("department", deptName);
        }

    } catch (err) {
        console.error("Dept fetch error:", err);
        setText("department", deptName);
    }
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

/* -------- INIT -------- */
window.onload = async function () {
    setText("subject", subjectName);

    await loadFacultyInfo(); // 🔥 NEW (DB-based dept)

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