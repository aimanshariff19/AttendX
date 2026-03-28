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
    }, 2500)
}

/* -------- Load Dates -------- */

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

/* -------- Percentage -------- */

function calculatePercentage(usn) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.startsWith(`${subject}_${department}_${program}_${sem}_${section}_`)) {

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

/* -------- Toggle + Reason + Color -------- */

function handleToggle(toggle) {

    const row = toggle.closest("tr")
    const reasonBox = row.querySelector(".reasonBox")

    // show reason only if changed
    if (toggle.checked !== toggle.defaultChecked) {
        reasonBox.style.display = "block"
    } else {
        reasonBox.style.display = "none"
        reasonBox.value = ""
    }

    // row color
    row.style.background = toggle.checked ? "#dcfce7" : "#fee2e2"
}

/* -------- Load Attendance -------- */

function loadAttendance() {

    const date = dateDropdown.value

    if (!date) {
        showMessage("Select a date first", "error")
        return
    }

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}`
    const saved = JSON.parse(localStorage.getItem(key))

    if (!saved) {
        showMessage("Attendance not found", "error")
        return
    }

    const records = saved.data || saved

    table.innerHTML = ""

    studentsList.forEach(student => {

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
<input type="checkbox"
data-usn="${student.usn}"
${isPresent ? "checked" : ""}>
<span class="slider"></span>
</label>
</td>

<td>
<textarea class="reasonBox" placeholder="Enter reason" style="display:none"></textarea>
</td>
`

        table.appendChild(row)
    })

    document.querySelectorAll(".toggle-switch input").forEach(toggle => {

        // 🔥 SET DEFAULT STATE (THIS FIXES OFF BUG)
        toggle.defaultChecked = toggle.checked

        toggle.addEventListener("change", () => handleToggle(toggle))
        handleToggle(toggle)
    })

    showMessage("Attendance loaded 🎉", "success")
}

/* -------- 🔥 BULK ACTIONS -------- */

function markAllEdit(status) {

    document.querySelectorAll(".toggle-switch input").forEach(toggle => {

        toggle.checked = (status === "Present")

        // force reason if changed
        handleToggle(toggle)
    })

    showMessage(`All marked ${status} ✅`, "success")
}

/* -------- Update -------- */

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

        // require reason only if changed
        if (toggle.checked !== toggle.defaultChecked && reasonBox.value.trim() === "") {
            reasonMissing = true
            reasonBox.style.border = "1px solid red"
        }

        attendanceData.push({
            usn,
            status
        })
    })

    if (reasonMissing) {
        showMessage("Enter reason for changes", "error")
        return
    }

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}`

    // overwrite cleanly
    localStorage.setItem(key, JSON.stringify({
        data: attendanceData
    }))

    showMessage("Updated successfully ✅", "success")

    setTimeout(() => {
        window.location.href = "attendance.html"
    }, 1200)
}

/* -------- INIT -------- */

loadAvailableDates()

/* -------- Back -------- */

function goBack() {
    window.location.href = "attendance.html"
}