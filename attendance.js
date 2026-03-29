/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- CLASS DETAILS -------- */
const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program")
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerHTML = value || "-"
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

/* -------- GLOBAL STORAGE -------- */
let attendanceData = {}

function loadStorage() {
    try {
        attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || {}
    } catch {
        attendanceData = {}
    }
}

function saveStorage() {
    localStorage.setItem("attendanceData", JSON.stringify(attendanceData))
}

/* -------- STUDENTS -------- */
let studentList = []
const classKey = `${department}_${program}_${sem}_${section}`

function initStudents() {
    if (typeof students !== "undefined") {
        studentList = students[classKey] || []
    }
}

const table = document.getElementById("studentRows")

/* -------- CALCULATE % -------- */
function calculatePercentage(usn, currentStatus = null) {

    const base = getBaseKey()
    const records = attendanceData[base] || []

    let present = 0
    let total = 0

    records.forEach(r => {
        if (r.usn === usn) {
            total++
            if (r.status === "Present") present++
        }
    })

    if (currentStatus !== null) {
        total++
        if (currentStatus === "Present") present++
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}

/* -------- LOAD STUDENTS -------- */
function loadStudents() {

    if (!table || typeof students === "undefined") return

    table.innerHTML = ""

    studentList.forEach((student, index) => {

        let percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

        row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>
<td class="percent">${percent}%</td>
<td>
<label class="toggle-switch">
<input type="checkbox" data-usn="${student.usn}" checked>
<span class="slider"></span>
</label>
</td>
`

        row.style.animation = `fadeUp ${0.4 + index * 0.05}s ease`

        updateRowStyle(row, percent, true)
        table.appendChild(row)
    })

    document.querySelectorAll(".toggle-switch input")
        .forEach(input => input.addEventListener("change", updateLivePercentage))

    updateStats()
}

/* -------- ROW STYLE -------- */
function updateRowStyle(row, percent, isPresent) {
    row.style.borderLeft = percent < 75 ? "5px solid red" : "none"
    row.style.background = isPresent ? "#dcfce7" : "#fee2e2"
}

/* -------- LIVE UPDATE -------- */
function updateLivePercentage() {

    document.querySelectorAll("#studentRows tr").forEach(row => {

        const input = row.querySelector("input")
        const usn = input.dataset.usn
        const percentCell = row.querySelector(".percent")

        const status = input.checked ? "Present" : "Absent"

        let percent = calculatePercentage(usn, status)

        percentCell.innerText = percent + "%"
        updateRowStyle(row, percent, input.checked)
    })

    updateStats()
}

/* -------- STATS -------- */
function updateStats() {

    let total = 0
    let present = 0

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        total++
        if (input.checked) present++
    })

    setText("totalCount", total)
    setText("presentCount", present)
    setText("absentCount", total - present)
}

/* -------- 🚀 SUBMIT ATTENDANCE -------- */
function submitAttendance() {

    const btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!date) {
        showMessage("⚠️ Fill date properly", "error")
        return
    }

    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        const base = getBaseKey()

        if (!attendanceData[base]) {
            attendanceData[base] = []
        }

        document.querySelectorAll(".toggle-switch input").forEach(input => {
            attendanceData[base].push({
                usn: input.dataset.usn,
                status: input.checked ? "Present" : "Absent",
                date
            })
        })

        saveStorage()

        showMessage("✅ Attendance Saved", "success")

        setTimeout(() => {
            window.location.href = "dashboard.html"
        }, 600)

    }, 600)
}

/* -------- INIT -------- */
window.onload = function () {

    loadStorage()

    const today = new Date().toISOString().split("T")[0]
    document.getElementById("date").value = today

    setTimeout(() => {
        initStudents()
        loadStudents()
    }, 100)
}

/* -------- MESSAGE -------- */
function showMessage(text, type) {

    let box = document.getElementById("messageBox")
    if (!box) return

    box.innerHTML = text
    box.style.display = "block"
    box.className = "message-box " + type

    setTimeout(() => {
        box.style.display = "none"
    }, 2500)
}

/* -------- BACK -------- */
function goBack() {
    window.location.href = "dashboard.html"
}