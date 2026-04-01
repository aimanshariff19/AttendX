/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text) {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerHTML
    btn.classList.add("loading")
    btn.innerHTML = `${text} <span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    btn.classList.remove("loading")
    btn.innerHTML = btn.dataset.original
}

/* -------- CLASS DETAILS -------- */
let subject = localStorage.getItem("subject")
let department = localStorage.getItem("department")
let program = localStorage.getItem("program")
let sem = localStorage.getItem("sem")
let section = localStorage.getItem("section")

if (!department) {
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
let table = null

function initStudents() {
    if (typeof students === "undefined") return

    const key = `${(department || "").toUpperCase()}_${(program || "").toUpperCase()}_${sem}_${(section || "").toUpperCase()}`
    studentList = students[key] || []
}

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

    table.innerHTML = ""

    if (studentList.length === 0) {
        table.innerHTML = `<tr><td colspan="4">No students</td></tr>`
        return
    }

    studentList.forEach((student) => {

        let percent = calculatePercentage(student.usn, "Present")

        let row = document.createElement("tr")

        row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>

<td>
    <span class="percent-text">${percent}%</span>
    <div class="bar">
        <div class="fill" style="width:${percent}%"></div>
    </div>
</td>

<td>
    <div class="attendance-actions">
        <button class="status-btn present active" onclick="setStatus(this, true)">Present</button>
        <button class="status-btn absent" onclick="setStatus(this, false)">Absent</button>
    </div>
</td>
`

        table.appendChild(row)
    })
}

/* -------- STATUS UPDATE -------- */
function setStatus(btn, isPresent) {

    const row = btn.closest("tr")
    const buttons = row.querySelectorAll(".status-btn")

    buttons.forEach(b => b.classList.remove("active"))
    btn.classList.add("active")

    const percentText = row.querySelector(".percent-text")
    const fill = row.querySelector(".fill")

    const usn = row.children[0].innerText
    const status = isPresent ? "Present" : "Absent"

    let percent = calculatePercentage(usn, status)

    if (percentText) percentText.innerText = percent + "%"
    if (fill) fill.style.width = percent + "%"

    // 🔥 row color feedback
    row.style.background = isPresent
        ? "rgba(34,197,94,0.08)"
        : "rgba(239,68,68,0.08)"
}

/* -------- SUBMIT -------- */
function submitAttendance(btn) {

    if (!btn) btn = document.getElementById("submitBtn")

    setBtnLoading(btn, "Submitting")

    setTimeout(() => {

        let data = []

        document.querySelectorAll("#studentRows tr").forEach(row => {

            const presentBtn = row.querySelector(".present")
            if (!presentBtn) return

            data.push({
                usn: row.children[0].innerText,
                status: presentBtn.classList.contains("active") ? "Present" : "Absent"
            })
        })

        console.log("Saved:", data)

        window.location.href = "dashboard.html"

    }, 800)
}

/* -------- NAV -------- */
function goBack() {
    const btn = event.target.closest(".btn")
    setBtnLoading(btn, "Going back")

    setTimeout(() => {
        window.location.href = "dashboard.html"
    }, 200)
}

function editAttendance() {
    const btn = event.target.closest(".btn")
    setBtnLoading(btn, "Opening")

    setTimeout(() => {
        window.location.href = "edit-attendance.html"
    }, 200)
}

/* -------- BULK -------- */
function markAll(isPresent) {

    const btn = event.target.closest(".btn")
    setBtnLoading(btn, "Updating")

    setTimeout(() => {

        document.querySelectorAll("#studentRows tr").forEach(row => {

            const presentBtn = row.querySelector(".present")
            const absentBtn = row.querySelector(".absent")

            if (!presentBtn) return

            presentBtn.classList.remove("active")
            absentBtn.classList.remove("active")

            if (isPresent) presentBtn.classList.add("active")
            else absentBtn.classList.add("active")

            setStatus(isPresent ? presentBtn : absentBtn, isPresent)
        })

        resetBtn(btn)

    }, 400)
}

/* -------- INIT -------- */
window.onload = function () {

    table = document.getElementById("studentRows")

    const today = new Date().toISOString().split("T")[0]
    document.getElementById("date").value = today

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange)

    initStudents()
    loadStudents()
}