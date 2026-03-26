/* -------- Class details -------- */

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

const classKey = `${department}_${program}_${sem}_${section}`
const studentsList = students[classKey] || []

const dateDropdown = document.getElementById("attendanceDate")
const table = document.getElementById("studentRows")

/* -------- Message box -------- */

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

/* -------- Load previous attendance dates -------- */

function loadAvailableDates() {

    dateDropdown.innerHTML = ""

    const prefix = `${subject}_${department}_${program}_${sem}_${section}_`
    let dates = []

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i)

        if (key && key.startsWith(prefix)) {

            const date = key.substring(prefix.length)
            dates.push(date)

        }
    }

    if (dates.length === 0) {

        const option = document.createElement("option")
        option.value = ""
        option.textContent = "No attendance records"
        dateDropdown.appendChild(option)
        return
    }

    dates.sort().reverse()

    dates.forEach(date => {

        const option = document.createElement("option")
        option.value = date
        option.textContent = date
        dateDropdown.appendChild(option)

    })
}

/* -------- Calculate attendance percentage -------- */

function calculatePercentage(usn) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.startsWith(`${subject}_${department}_${program}_${sem}_${section}_`)) {

            let data = JSON.parse(localStorage.getItem(key) || "[]")

            let record = data.find(r => r.usn === usn)

            if (record) {

                total++

                if (record.status === "Present") present++

            }
        }
    }

    if (total === 0) return 0

    return Math.round((present / total) * 100)
}

/* -------- Show reason box when edited -------- */

function toggleReasonBox(toggle) {

    const row = toggle.closest("tr")
    const reasonBox = row.querySelector(".reasonBox")

    if (toggle.checked !== toggle.defaultChecked) {

        reasonBox.style.display = "block"

    } else {

        reasonBox.style.display = "none"
        reasonBox.value = ""
    }
}

/* -------- Load attendance for selected date -------- */

function loadAttendance() {

    const date = dateDropdown.value

    if (!date) {

        showMessage("Select a date first", "error")
        return
    }

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}`

    const savedAttendance = localStorage.getItem(key)

    if (!savedAttendance) {

        showMessage("Attendance not found for selected date", "error")
        return
    }

    const data = JSON.parse(savedAttendance)

    table.innerHTML = ""

    studentsList.forEach(student => {

        const record = data.find(r => r.usn === student.usn)

        const checked = record && record.status === "Present" ? "checked" : ""

        const percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

        row.innerHTML = `

<td>${student.usn}</td>
<td>${student.name}</td>
<td>${percent}%</td>

<td>
<label class="toggle-switch">
<input type="checkbox"
data-usn="${student.usn}"
${checked}
onchange="toggleReasonBox(this)">
<span class="slider"></span>
</label>
</td>

<td>
<textarea
class="reasonBox"
placeholder="Enter reason for edit"
style="display:none"></textarea>
</td>

`

        table.appendChild(row)
    })

    showMessage("Attendance loaded successfully 🎉", "success")
}

/* -------- Update attendance -------- */

function updateAttendance() {

    const date = dateDropdown.value

    if (!date) {

        showMessage("Select a date first", "error")
        return
    }

    let attendanceData = []
    let reasonMissing = false

    document.querySelectorAll("#studentRows tr").forEach(row => {

        const toggle = row.querySelector(".toggle-switch input")
        const reasonBox = row.querySelector(".reasonBox")

        const status = toggle.checked ? "Present" : "Absent"
        const usn = toggle.dataset.usn

        if (toggle.checked !== toggle.defaultChecked && reasonBox.value.trim() === "") {

            reasonMissing = true
            reasonBox.style.border = "1px solid red"
        }

        attendanceData.push({
            usn: usn,
            status: status
        })
    })

    if (reasonMissing) {

        showMessage("Please enter reason for edited attendance", "error")
        return
    }

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}`

    localStorage.setItem(key, JSON.stringify(attendanceData))

    showMessage("Attendance updated successfully 🎉", "success")

    setTimeout(() => {
        window.location.href = "attendance.html"
    }, 1200)
}

/* -------- Initialize page -------- */

loadAvailableDates()

/* -------- Back Button -------- */

function goBack() {

    if (!localStorage.getItem("subject")) {
        window.location.href = "dashboard.html"
        return
    }

    window.location.href = "attendance.html"
}