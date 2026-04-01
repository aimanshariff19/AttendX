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

const classKey = `${department}_${program}_${sem}_${section}`

function initStudents() {
    if (typeof students === "undefined") return

    const dept = (department || "").trim().toUpperCase()
    const prog = (program || "").trim().toUpperCase()
    const s = (sem || "").toString().trim()
    const sec = (section || "").trim().toUpperCase()

    const key = `${dept}_${prog}_${s}_${sec}`

    console.log("🔥 FINAL KEY:", key)
    console.log("📦 AVAILABLE KEYS:", Object.keys(students))

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
    if (!table || studentList.length === 0) return

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

        row.style.opacity = "0"
        row.style.transform = "translateY(10px)"

        setTimeout(() => {
            row.style.transition = "0.3s ease"
            row.style.opacity = "1"
            row.style.transform = "translateY(0)"
        }, index * 60)

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

    if (percent < 75) fill.parentElement.classList.add("low-bar")
    else fill.parentElement.classList.remove("low-bar")

    statusText.innerText = status
    statusText.style.color = input.checked ? "#22c55e" : "#ef4444"

    updateRowStyle(row, percent, input.checked)
    updateStats()
}

/* -------- 🔥 FIXED ROW STYLE -------- */
function updateRowStyle(row, percent, isPresent) {

    /* base dark */
    row.style.background = "rgba(255,255,255,0.05)"
    row.style.borderLeft = "4px solid transparent"

    /* absent = subtle red */
    if (!isPresent) {
        row.style.borderLeft = "4px solid #ef4444"
        row.style.background = "rgba(239,68,68,0.08)"
    }

    /* low attendance warning */
    if (percent < 75) {
        row.style.borderLeft = "4px solid #f59e0b"
    }
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

/* -------- TIME RANGE -------- */
function calculateTimeRange() {

    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!startTime || !numClasses) return

    let [hour, minute] = startTime.split(":").map(Number)

    let start = new Date()
    start.setHours(hour, minute, 0)

    let end = new Date(start)
    end.setMinutes(end.getMinutes() + (numClasses * 60))

    function format12(date) {
        let h = date.getHours()
        let m = date.getMinutes()
        let ampm = h >= 12 ? "PM" : "AM"
        h = h % 12 || 12
        return `${h}:${String(m).padStart(2, "0")} ${ampm}`
    }

    const el = document.getElementById("timeRange")
    if (el) el.innerText = `${format12(start)} - ${format12(end)}`
}

/* -------- CURRENT TIME -------- */
function updateCurrentTime() {
    const now = new Date()
    let h = now.getHours()
    let m = now.getMinutes()
    let ampm = h >= 12 ? "PM" : "AM"
    h = h % 12 || 12

    const el = document.getElementById("currentTime")
    if (el) el.value = `${h}:${String(m).padStart(2, "0")} ${ampm}`
}

/* -------- SUBMIT -------- */
function submitAttendance(btn) {

    if (!btn) btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!date || !startTime) {
        alert("Fill date & time")
        return
    }

    btn.classList.add("loading")

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

        btn.classList.remove("loading")
        window.location.href = "dashboard.html"

    }, 600)
}

/* -------- INIT -------- */
window.onload = function () {

    const today = new Date().toISOString().split("T")[0]

    const dateInput = document.getElementById("date")
    if (dateInput) dateInput.value = today

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    const classTime = document.getElementById("classTime")
    const numClasses = document.getElementById("numClasses")

    if (classTime) classTime.addEventListener("change", calculateTimeRange)
    if (numClasses) numClasses.addEventListener("change", calculateTimeRange)

    setTimeout(() => {
        initStudents()
        loadStudents()
    }, 100)
}

/* -------- NAV -------- */
function goBack() {
    window.location.href = "dashboard.html"
}

function editAttendance() {
    window.location.href = "edit-attendance.html"
}