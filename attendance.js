/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- CLASS DETAILS -------- */
let subject = localStorage.getItem("subject")
let department = localStorage.getItem("department")
let program = localStorage.getItem("program")
let sem = localStorage.getItem("sem")
let section = localStorage.getItem("section")

if (!department) {
    console.warn("⚠ Department missing, using fallback")
    department = localStorage.getItem("facultyDepartment") || "CSE"
}

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

setText("subject", subject)
setText("department", department)
setText("program", program)
setText("sem", sem)
setText("section", section)

/* -------- BASE KEY -------- */
function getBaseKey() {
    return `${normalize(subject)}_${normalize(department)}_${normalize(program)}_${sem}_${normalize(section)}`
}

/* -------- STORAGE -------- */
function getAttendanceRecords(key) {
    let stored = JSON.parse(localStorage.getItem(key) || "{}")
    return stored.data || []
}

/* -------- STUDENTS -------- */
let studentList = []

function initStudents() {
    if (typeof students === "undefined") return

    const key = `${(department || "").toUpperCase()}_${(program || "").toUpperCase()}_${sem}_${(section || "").toUpperCase()}`
    studentList = students[key] || []
}

const table = document.getElementById("studentRows")

/* -------- % CALC -------- */
function calculatePercentage(usn, currentStatus = null) {

    let present = 0
    let total = 0
    const base = getBaseKey()

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i)

        if (key && key.toLowerCase().startsWith(base)) {
            let records = getAttendanceRecords(key)
            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    total++
    if (currentStatus === null || currentStatus === "Present") {
        present++
    }

    return Math.round((present / total) * 100)
}

/* -------- LOAD STUDENTS -------- */
function loadStudents() {

    if (!table) return

    if (studentList.length === 0) {
        table.innerHTML = `
        <tr>
            <td colspan="4" class="empty">No students found</td>
        </tr>`
        return
    }

    table.innerHTML = ""

    studentList.forEach((student, index) => {

        let percent = calculatePercentage(student.usn, "Present")

        let row = document.createElement("tr")

        row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>

<td>
    <span class="percent-text">${percent}%</span>
    <div class="bar ${percent < 75 ? "low-bar" : ""}">
        <div class="fill" style="width:${percent}%"></div>
    </div>
</td>

<td>
    <div style="display:flex;align-items:center;gap:10px;">
        <label class="toggle-switch">
            <input type="checkbox" data-usn="${student.usn}" checked>
            <span class="slider"></span>
        </label>
        <span class="status-text" style="font-size:12px;color:#22c55e;">Present</span>
    </div>
</td>
`

        const percentText = row.querySelector(".percent-text")

        if (percent >= 85) percentText.style.color = "#22c55e"
        else if (percent >= 75) percentText.style.color = "#f59e0b"
        else percentText.style.color = "#ef4444"

        const input = row.querySelector("input")
        input.addEventListener("change", () => updateSingleRow(row, input))

        table.appendChild(row)
    })

    updateStats()
}

/* -------- UPDATE ROW -------- */
function updateSingleRow(row, input) {

    const usn = input.dataset.usn
    const percentText = row.querySelector(".percent-text")
    const statusText = row.querySelector(".status-text")
    const fill = row.querySelector(".fill")

    const status = input.checked ? "Present" : "Absent"

    let percent = calculatePercentage(usn, status)

    percentText.innerText = percent + "%"
    fill.style.width = percent + "%"

    if (percent >= 85) percentText.style.color = "#22c55e"
    else if (percent >= 75) percentText.style.color = "#f59e0b"
    else percentText.style.color = "#ef4444"

    statusText.innerText = status
    statusText.style.color = input.checked ? "#22c55e" : "#ef4444"

    updateStats()
}

/* -------- SUBMIT (SPINNER FIXED CLEAN) -------- */
function submitAttendance(btn) {

    if (!btn) btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!date || !startTime) {
        alert("Fill date & time")
        return
    }

    // 🔥 spinner ON
    btn.classList.add("loading")
    btn.innerHTML = "Submitting <span class='btn-spinner'></span>"

    setTimeout(() => {

        let [hour, minute] = startTime.split(":").map(Number)
        const base = getBaseKey()

        for (let i = 0; i < numClasses; i++) {

            let timeObj = new Date()
            timeObj.setHours(hour, minute + (i * 60))

            const formattedTime =
                `${String(timeObj.getHours()).padStart(2, "0")}:${String(timeObj.getMinutes()).padStart(2, "0")}`

            const key = `${base}_${date}_${formattedTime}`

            let data = []

            document.querySelectorAll(".toggle-switch input").forEach(input => {
                data.push({
                    usn: input.dataset.usn,
                    status: input.checked ? "Present" : "Absent"
                })
            })

            localStorage.setItem(key, JSON.stringify({ data }))
        }

        // 🔥 success
        btn.innerHTML = "✔ Submitted"

        setTimeout(() => {
            window.location.href = "dashboard.html"
        }, 800)

    }, 800)
}

/* -------- INIT -------- */
window.onload = function () {

    const today = new Date().toISOString().split("T")[0]
    document.getElementById("date").value = today

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange)

    setTimeout(() => {
        initStudents()
        loadStudents()
    }, 300)
}

/* -------- NAV -------- */
function goBack() {
    window.location.href = "dashboard.html"
}

function editAttendance() {
    window.location.href = "edit-attendance.html"
}

/* -------- BULK -------- */
function markAll(isPresent) {

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.checked = isPresent
        updateSingleRow(input.closest("tr"), input)
    })
}