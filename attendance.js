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

/* -------- 🔥 CURRENT TIME (12 HR) -------- */

function updateCurrentTime() {

    const now = new Date()

    let hours = now.getHours()
    let minutes = now.getMinutes()

    let ampm = hours >= 12 ? "PM" : "AM"

    hours = hours % 12
    hours = hours ? hours : 12

    let h = hours.toString().padStart(2, "0")
    let m = minutes.toString().padStart(2, "0")

    document.getElementById("currentTime").innerText = `${h}:${m} ${ampm}`
}

/* -------- TIME RANGE LOGIC (12 HR) -------- */

function updateTimeRange() {

    const startTime = document.getElementById("classTime").value
    const numClasses = parseInt(document.getElementById("numClasses").value)

    if (!startTime || !numClasses) {
        document.getElementById("timeRange").innerText = "--"
        return null
    }

    let [hours, minutes] = startTime.split(":").map(Number)

    let start = new Date()
    start.setHours(hours)
    start.setMinutes(minutes)

    let end = new Date(start)
    end.setHours(end.getHours() + numClasses)

    function formatTime(date) {
        let hrs = date.getHours()
        let mins = date.getMinutes()

        let ampm = hrs >= 12 ? "PM" : "AM"

        hrs = hrs % 12
        hrs = hrs ? hrs : 12

        let h = hrs.toString().padStart(2, "0")
        let m = mins.toString().padStart(2, "0")

        return `${h}:${m} ${ampm}`
    }

    let range = `${formatTime(start)} - ${formatTime(end)}`
    document.getElementById("timeRange").innerText = range

    return {
        startTime: formatTime(start),
        endTime: formatTime(end),
        range
    }
}

/* -------- Percentage -------- */

function calculatePercentage(usn) {

    let present = 0
    let total = 0

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

    if (total === 0) return 0
    return Math.round((present / total) * 100)
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
                <input type="checkbox" data-usn="${student.usn}" checked onchange="updateStats()">
                <span class="slider"></span>
            </label>
        </td>
        `

        table.appendChild(row)
    })

    updateStats()
}

/* -------- Bulk Actions -------- */

function markAll(status) {
    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.checked = (status === "Present")
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

/* -------- Submit Attendance -------- */

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
        showMessage("Already submitted for this date", "error")
        return
    }

    let attendanceData = []

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        attendanceData.push({
            usn: input.dataset.usn,
            status: input.checked ? "Present" : "Absent"
        })
    })

    let fullData = {
        date,
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        timeRange: timeData.range,
        numClasses,
        data: attendanceData
    }

    localStorage.setItem(key, JSON.stringify(fullData))

    showMessage("Attendance submitted ✅", "success")

    document.getElementById("submitBtn").disabled = true
}

/* -------- Navigation -------- */

function viewAttendance() {
    window.location.href = "edit-attendance.html"
}

function goBack() {
    window.location.href = "dashboard.html"
}

/* -------- Export -------- */

function exportToExcel() {

    let rows = document.querySelectorAll("#studentRows tr")

    let excel = `
<table border="1">
<tr>
<th>USN</th>
<th>Name</th>
<th>%</th>
<th>Status</th>
</tr>
`

    rows.forEach(row => {
        let usn = row.children[0].innerText
        let name = row.children[1].innerText
        let percent = row.children[2].innerText
        let status = row.querySelector("input").checked ? "Present" : "Absent"

        excel += `
<tr>
<td>${usn}</td>
<td>${name}</td>
<td>${percent}</td>
<td>${status}</td>
</tr>
`
    })

    excel += `</table>`

    let blob = new Blob([excel], { type: "application/vnd.ms-excel" })
    let link = document.createElement("a")

    link.href = URL.createObjectURL(blob)
    link.download = "attendance.xls"
    link.click()

    showMessage("Exported 📊", "success")
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