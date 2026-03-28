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

/* -------- UNIVERSAL GET -------- */
function getAttendanceRecords(key) {
    let stored = JSON.parse(localStorage.getItem(key) || "{}")
    return stored.data || []
}

/* -------- STUDENTS -------- */
const classKey = `${department}_${program}_${sem}_${section}`
const studentList = students[classKey] || []
const table = document.getElementById("studentRows")

/* -------- CALCULATE % -------- */
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

/* -------- 💧 RIPPLE -------- */
document.addEventListener("click", function (e) {
    const btn = e.target.closest("button")
    if (!btn) return

    const circle = document.createElement("span")
    circle.classList.add("ripple")

    const rect = btn.getBoundingClientRect()
    circle.style.left = (e.clientX - rect.left) + "px"
    circle.style.top = (e.clientY - rect.top) + "px"

    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
})

/* -------- 🕒 CURRENT TIME -------- */
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

/* -------- 🕒 DISPLAY TIME -------- */
function updateDisplayTime() {

    const time = document.getElementById("classTime")?.value
    if (!time) return

    let [hour, minute] = time.split(":").map(Number)

    let ampm = hour >= 12 ? "PM" : "AM"
    hour = hour % 12 || 12

    const formatted = `${hour}:${String(minute).padStart(2, "0")} ${ampm}`

    const el = document.getElementById("displayTime")
    if (el) el.innerText = formatted
}

/* -------- ⏱ TIME RANGE -------- */
function updateTimeRange() {

    const startTime = document.getElementById("classTime")?.value
    const numClasses = parseInt(document.getElementById("numClasses")?.value)

    if (!startTime || !numClasses) return

    let [hour, minute] = startTime.split(":").map(Number)
    let endHour = hour + numClasses

    function format(h, m) {
        let ampm = h >= 12 ? "PM" : "AM"
        h = h % 12 || 12
        return `${h}:${String(m).padStart(2, "0")} ${ampm}`
    }

    const range = `${format(hour, minute)} - ${format(endHour, minute)}`

    const el = document.getElementById("timeRange")
    if (el) el.innerText = range
}

/* -------- 🚀 SUBMIT ATTENDANCE -------- */
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
    btn.innerText = ""

    setTimeout(() => {

        let [hour, minute] = startTime.split(":").map(Number)
        const base = getBaseKey()

        for (let i = 0; i < numClasses; i++) {

            const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
            const key = `${base}_${date}_${currentTime}`

            let data = []

            document.querySelectorAll(".toggle-switch input").forEach(input => {
                data.push({
                    usn: input.dataset.usn,
                    status: input.checked ? "Present" : "Absent"
                })
            })

            localStorage.setItem(key, JSON.stringify({ data }))
            hour++
        }

        showMessage("✅ Attendance Saved", "success")

        setTimeout(() => {
            window.location.href = "dashboard.html"
        }, 600)

    }, 800)
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

    loadStudents()

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    // 🔥 INITIAL LOAD FIX
    updateDisplayTime()
    updateTimeRange()

    // 🔥 EVENT LISTENERS
    document.getElementById("classTime")?.addEventListener("change", () => {
        updateDisplayTime()
        updateTimeRange()
    })

    document.getElementById("numClasses")?.addEventListener("input", updateTimeRange)
}

/* -------- BACK BUTTON -------- */
function goBack() {
    window.history.back()
}
