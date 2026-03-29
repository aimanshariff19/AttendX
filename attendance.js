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
    if (typeof students !== "undefined") {
        studentList = students[classKey] || []
    }
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

    if (currentStatus !== null) {
        total++
        if (currentStatus === "Present") present++
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}

/* -------- LOAD STUDENTS -------- */
function loadStudents() {
    if (!table || studentList.length === 0) return

    table.innerHTML = ""

    studentList.forEach((student, index) => {

        let percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

        row.innerHTML = `
        <td>${student.usn}</td>
        <td>${student.name}</td>
        <td class="percent">${percent}%</td>
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

        row.style.animation = `fadeUp 0.4s ease ${index * 0.05}s both`

        updateRowStyle(row, percent, true)

        const input = row.querySelector("input")
        input.addEventListener("change", () => updateSingleRow(row, input))

        table.appendChild(row)
    })

    updateStats()
}

/* -------- UPDATE SINGLE ROW -------- */
function updateSingleRow(row, input) {

    const usn = input.dataset.usn
    const percentCell = row.querySelector(".percent")
    const statusText = row.querySelector(".status-text")

    const status = input.checked ? "Present" : "Absent"

    let percent = calculatePercentage(usn, status)

    percentCell.innerText = percent + "%"
    statusText.innerText = status
    statusText.style.color = input.checked ? "#22c55e" : "#ef4444"

    updateRowStyle(row, percent, input.checked)
    updateStats()
}

/* -------- ROW STYLE -------- */
function updateRowStyle(row, percent, isPresent) {
    row.style.borderLeft = percent < 75 ? "4px solid #ef4444" : "4px solid transparent"
    row.style.background = isPresent ? "#f0fdf4" : "#fef2f2"
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

/* -------- TIME RANGE (🔥 FIXED) -------- */
function calculateTimeRange() {

    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!startTime || !numClasses) return

    let [hour, minute] = startTime.split(":").map(Number)

    let start = new Date()
    start.setHours(hour, minute)

    let end = new Date(start)
    end.setHours(start.getHours() + numClasses)

    function format12(date) {
        let h = date.getHours()
        let m = date.getMinutes()
        let ampm = h >= 12 ? "PM" : "AM"
        h = h % 12 || 12
        return `${h}:${String(m).padStart(2, "0")} ${ampm}`
    }

    const startStr = format12(start)
    const endStr = format12(end)

    document.getElementById("timeRange").innerText = `${startStr} - ${endStr}`
    document.getElementById("displayTime").innerText = startStr
}

/* -------- CURRENT TIME -------- */
function updateCurrentTime() {

    const now = new Date()

    let hours = now.getHours()
    let minutes = now.getMinutes()

    let ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12

    const timeString = `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`

    const el = document.getElementById("currentTime")
    if (el) el.innerText = timeString
}

/* -------- SUBMIT -------- */
function submitAttendance() {

    const btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!date || !startTime) {
        showMessage("⚠️ Fill date & time properly", "error")
        return
    }

    btn.classList.add("loading")

    setTimeout(() => {

        let [hour, minute] = startTime.split(":").map(Number)
        const base = getBaseKey()

        for (let i = 0; i < numClasses; i++) {

            let timeObj = new Date()
            timeObj.setHours(hour + i, minute)

            let h = timeObj.getHours()
            let m = timeObj.getMinutes()

            const formattedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`

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

        const overlay = document.getElementById("successOverlay")
        if (overlay) overlay.classList.add("show")

        btn.classList.remove("loading")

        setTimeout(() => {
            window.location.href = "dashboard.html"
        }, 1000)

    }, 600)
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
    }, 100)
}

/* -------- BACK -------- */
function goBack() {
    window.location.href = "dashboard.html"
}