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


/* -------- NAVIGATION -------- */

function viewAttendance() {
    window.location.href = "edit-attendance.html"
}

function goBack() {
    window.location.href = "dashboard.html"
}


/* -------- STUDENTS -------- */

const classKey = `${department}_${program}_${sem}_${section}`
const studentList = students[classKey] || []
const table = document.getElementById("studentRows")


/* -------- BASE KEY -------- */

function getBaseKey() {
    return `${subject}_${department}_${program}_${sem}_${section}`
}


/* -------- TIME FORMAT -------- */

function formatTo12Hour(time24) {
    if (!time24) return "--"

    let [hour, minute] = time24.split(":").map(Number)
    let ampm = hour >= 12 ? "PM" : "AM"
    hour = hour % 12 || 12

    return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`
}


/* -------- TIME RANGE -------- */

function updateTimeRange() {

    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!startTime || !numClasses) return

    let [hour, minute] = startTime.split(":").map(Number)
    let endHour = hour + numClasses

    const startFormatted = formatTo12Hour(startTime)
    const endFormatted = formatTo12Hour(
        `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    )

    setText("timeRange", `${startFormatted} - ${endFormatted}`)
}


/* -------- CURRENT TIME -------- */

function updateCurrentTime() {

    const now = new Date()

    let hours = now.getHours()
    let minutes = now.getMinutes()

    let ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12

    const timeString = `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`

    setText("currentTime", timeString)
}


/* -------- CALCULATE % -------- */

function calculatePercentage(usn, currentStatus = null) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.startsWith(getBaseKey())) {

            let stored = JSON.parse(localStorage.getItem(key) || "{}")
            let records = stored.data || stored

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

    if (!table) return

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

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.addEventListener("change", updateLivePercentage)
    })

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


/* -------- SUBMIT ATTENDANCE (SMART) -------- */

function submitAttendance() {

    const btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!date || !startTime) {
        showMessage("⚠️ Fill date & time properly", "error")
        return
    }

    let [hour, minute] = startTime.split(":").map(Number)

    let successCount = 0
    let skippedCount = 0

    for (let i = 0; i < numClasses; i++) {

        const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        const key = `${getBaseKey()}_${date}_${currentTime}`

        if (localStorage.getItem(key)) {
            skippedCount++
        } else {

            let data = []

            document.querySelectorAll(".toggle-switch input").forEach(input => {
                data.push({
                    usn: input.dataset.usn,
                    status: input.checked ? "Present" : "Absent"
                })
            })

            localStorage.setItem(key, JSON.stringify({ data }))
            successCount++
        }

        hour += 1
    }

    if (successCount > 0) {
        btn.innerHTML = "✅ Submitted"
        btn.disabled = true
        btn.style.background = "#16a34a"

        showMessage(`✅ Saved ${successCount} class(es)`, "success")
    }

    if (skippedCount > 0) {
        showMessage(`⚠️ ${skippedCount} already existed`, "error")
    }
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


/* -------- CHECK SUBMISSION -------- */

function checkSubmissionStatus() {

    const btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const startTime = document.getElementById("classTime")?.value

    if (!date || !startTime) return

    const key = `${getBaseKey()}_${date}_${startTime}`

    if (localStorage.getItem(key)) {
        btn.innerHTML = "⚠️ Already Submitted"
        btn.disabled = true
    } else {
        btn.innerHTML = "🚀 Submit Attendance"
        btn.disabled = false
    }
}


/* -------- INIT -------- */

window.onload = function () {

    loadStudents()

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("date")?.addEventListener("change", checkSubmissionStatus)

    document.getElementById("classTime")?.addEventListener("change", () => {
        checkSubmissionStatus()
        updateTimeRange()
    })

    document.getElementById("numClasses")?.addEventListener("input", updateTimeRange)
}