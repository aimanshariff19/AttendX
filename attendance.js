/* -------- Message Box -------- */

function showMessage(text, type) {
    const box = document.getElementById("messageBox")
    if (!box) return

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 3000)
}

/* -------- Class details -------- */

const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program")
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

document.getElementById("subject").innerText = subject
document.getElementById("department").innerText = department
document.getElementById("program").innerText = program
document.getElementById("sem").innerText = sem
document.getElementById("section").innerText = section

/* -------- Students -------- */

const classKey = `${department}_${program}_${sem}_${section}`
const studentList = students[classKey] || []
const table = document.getElementById("studentRows")

/* -------- TIME -------- */

function updateCurrentTime() {
    const now = new Date()

    let hours = now.getHours()
    let minutes = now.getMinutes()
    let ampm = hours >= 12 ? "PM" : "AM"

    hours = hours % 12 || 12

    document.getElementById("currentTime").innerText =
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`
}

/* -------- TIME RANGE -------- */

function updateTimeRange() {
    const startTime = document.getElementById("classTime").value
    const numClasses = parseInt(document.getElementById("numClasses").value)

    if (!startTime || !numClasses) {
        document.getElementById("timeRange").innerText = "--"
        return null
    }

    let [hours, minutes] = startTime.split(":").map(Number)

    let start = new Date()
    start.setHours(hours, minutes)

    let end = new Date(start)
    end.setHours(end.getHours() + numClasses)

    function format(date) {
        let hrs = date.getHours()
        let mins = date.getMinutes()
        let ampm = hrs >= 12 ? "PM" : "AM"

        hrs = hrs % 12 || 12

        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${ampm}`
    }

    const range = `${format(start)} - ${format(end)}`
    document.getElementById("timeRange").innerText = range

    return {
        startTime: format(start),
        endTime: format(end),
        range
    }
}

/* -------- Percentage -------- */

function calculatePercentage(usn) {
    let present = 0, total = 0

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i)

        if (key && key.includes(subject)) {
            let stored = JSON.parse(localStorage.getItem(key) || "{}")
            let records = stored.data || stored

            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}

/* -------- Load Students -------- */

function loadStudents() {

    table.innerHTML = ""

    studentList.forEach(student => {

        let percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

        row.innerHTML = `
        <td>${student.usn}</td>
        <td>${student.name}</td>
        <td>${percent}%</td>
        <td>
            <label class="toggle-switch">
                <input type="checkbox" data-usn="${student.usn}" checked>
                <span class="slider"></span>
            </label>
        </td>
        `

        table.appendChild(row)
    })

    // 🔥 ADD EVENT LISTENER HERE (important fix)
    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.addEventListener("change", () => {
            updateStats()
            updateRowColor(input)
        })
    })

    updateStats()
    applyRowColors()
}

/* -------- Row Color -------- */

function updateRowColor(input) {
    const row = input.closest("tr")
    row.style.background = input.checked ? "#dcfce7" : "#fee2e2"
}

function applyRowColors() {
    document.querySelectorAll(".toggle-switch input").forEach(updateRowColor)
}

/* -------- Bulk -------- */

function markAll(status) {
    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.checked = (status === "Present")
        updateRowColor(input)
    })
    updateStats()
}

/* -------- Stats -------- */

function updateStats() {
    let total = studentList.length
    let present = document.querySelectorAll(".toggle-switch input:checked").length
    let absent = total - present

    document.getElementById("totalCount").innerText = total
    document.getElementById("presentCount").innerText = present
    document.getElementById("absentCount").innerText = absent
}

/* -------- Submit -------- */

function submitAttendance() {

    const date = document.getElementById("date").value
    const time = document.getElementById("classTime").value
    const numClasses = document.getElementById("numClasses").value
    const timeData = updateTimeRange()

    if (!date || !time || !timeData) {
        showMessage("Select date & time properly", "error")
        return
    }

    let key = `${subject}_${department}_${program}_${sem}_${section}_${date}`

    if (localStorage.getItem(key)) {
        showMessage("Already submitted", "error")
        return
    }

    let attendanceData = []

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        attendanceData.push({
            usn: input.dataset.usn,
            status: input.checked ? "Present" : "Absent"
        })
    })

    localStorage.setItem(key, JSON.stringify({
        date,
        ...timeData,
        numClasses,
        data: attendanceData
    }))

    showMessage("Attendance submitted ✅", "success")
    document.getElementById("submitBtn").disabled = true
}

/* -------- INIT -------- */

window.onload = function () {

    loadStudents()

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0]

    document.getElementById("classTime").value = "08:30"

    document.getElementById("classTime").addEventListener("change", updateTimeRange)
    document.getElementById("numClasses").addEventListener("change", updateTimeRange)

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    updateTimeRange()
}

function viewAttendance() {
    window.location.href = "edit-attendance.html";
}