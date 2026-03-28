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

/* -------- 🔥 SAFE STUDENTS LOAD -------- */
let studentsList = []
function initStudents() {
    if (typeof students !== "undefined") {
        const classKey = `${department}_${program}_${sem}_${section}`
        studentsList = students[classKey] || []
    }
}

/* -------- FORMAT TIME -------- */
function formatTo12Hour(time24) {
    if (!time24) return "--"

    let [hour, minute] = time24.split(":").map(Number)
    let ampm = hour >= 12 ? "PM" : "AM"
    hour = hour % 12 || 12

    return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`
}

/* -------- CLASS DETAILS -------- */
const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program")
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

document.getElementById("subject").innerText = subject || "-"
document.getElementById("department").innerText = department || "-"
document.getElementById("program").innerText = program || "-"
document.getElementById("sem").innerText = sem || "-"
document.getElementById("section").innerText = section || "-"

const dateDropdown = document.getElementById("attendanceDate")
const table = document.getElementById("studentRows")
const timeDropdown = document.getElementById("timeSelect")

/* -------- MESSAGE -------- */
function showMessage(text, type) {
    const box = document.getElementById("messageBox")
    if (!box) return

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 2500)
}

/* -------- LOAD TIMES -------- */
function loadTimesForDate() {

    const date = dateDropdown.value
    if (!date) return

    let times = []
    timeDropdown.innerHTML = ""

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i)
        if (!key) continue

        if (key.toLowerCase().includes(subject.toLowerCase()) && key.includes(date)) {

            const parts = key.split("_")
            const keyDate = parts[parts.length - 2]
            const keyTime = parts[parts.length - 1]

            if (keyDate === date) {
                times.push(keyTime)
            }
        }
    }

    times = [...new Set(times)].sort()

    if (times.length === 0) {
        timeDropdown.innerHTML = "<option>No classes</option>"
        return
    }

    times.forEach((time, index) => {
        const option = document.createElement("option")
        option.value = time
        option.textContent = `${formatTo12Hour(time)} (Class ${index + 1})`
        timeDropdown.appendChild(option)
    })
}

/* -------- PERCENTAGE -------- */
function calculatePercentage(usn) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.toLowerCase().includes(subject.toLowerCase())) {

            let stored = JSON.parse(localStorage.getItem(key) || "{}")
            let records = stored.data || []

            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}

/* -------- LOAD ATTENDANCE -------- */
function loadAttendance() {

    const date = dateDropdown.value
    const time = timeDropdown.value

    if (!date || !time) {
        showMessage("Select date & time", "error")
        return
    }

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}_${time}`

    const saved = JSON.parse(localStorage.getItem(key))
    if (!saved) {
        showMessage("Attendance not found", "error")
        return
    }

    const records = saved.data || []
    table.innerHTML = ""

    studentsList.forEach((student, index) => {

        const record = records.find(r => r.usn === student.usn)
        const isPresent = record && record.status === "Present"
        const percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

        row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>
<td>${percent}%</td>
<td>
<label class="toggle-switch">
<input type="checkbox" data-usn="${student.usn}" ${isPresent ? "checked" : ""}>
<span class="slider"></span>
</label>
</td>
<td>
<textarea class="reasonBox" placeholder="Enter reason" style="display:none"></textarea>
</td>
`

        table.appendChild(row)
    })
}

/* -------- UPDATE -------- */
function updateAttendance() {

    const date = dateDropdown.value
    const time = timeDropdown.value

    if (!date || !time) {
        showMessage("Select date & time", "error")
        return
    }

    let attendanceData = []

    document.querySelectorAll("#studentRows tr").forEach(row => {

        const toggle = row.querySelector("input")

        attendanceData.push({
            usn: toggle.dataset.usn,
            status: toggle.checked ? "Present" : "Absent"
        })
    })

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}_${time}`

    localStorage.setItem(key, JSON.stringify({ data: attendanceData }))

    showMessage("Updated successfully ✅", "success")

    setTimeout(() => {
        window.location.href = "attendance.html"
    }, 500)
}

/* -------- INIT -------- */
window.onload = function () {

    // 🔥 ensure students loaded first
    setTimeout(() => {
        initStudents()
    }, 100)
}

dateDropdown.addEventListener("change", loadTimesForDate)

/* -------- BACK FIX -------- */
function goBack() {
    window.location.href = "attendance.html"
}