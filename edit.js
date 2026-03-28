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
const timeDropdown = document.getElementById("timeSelect")


/* -------- Base Key -------- */

function getBaseKey() {
    return `${subject}_${department}_${program}_${sem}_${section}`
}


/* -------- Message -------- */

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


/* -------- 🔥 LOAD TIMES (FINAL FIX) -------- */

function loadTimesForDate() {

    const date = dateDropdown.value

    console.log("Selected date:", date)

    if (!date) {
        timeDropdown.innerHTML = "<option>Select date first</option>"
        return
    }

    const base = getBaseKey()
    let times = []

    timeDropdown.innerHTML = ""

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i)
        if (!key) continue

        if (key.startsWith(base + "_")) {

            const remaining = key.replace(base + "_", "")
            const parts = remaining.split("_")

            if (parts.length !== 2) continue

            const keyDate = parts[0]
            const keyTime = parts[1]

            if (keyDate === date) {
                times.push(keyTime)
            }
        }
    }

    times = [...new Set(times)]
    times.sort((a, b) => a.localeCompare(b))

    if (times.length === 0) {
        timeDropdown.innerHTML = "<option>No classes found</option>"
        return
    }

    times.forEach(time => {
        const option = document.createElement("option")
        option.value = time
        option.textContent = formatTo12Hour(time)
        timeDropdown.appendChild(option)
    })

    console.log("Times loaded:", times)
}


/* -------- Percentage -------- */

function calculatePercentage(usn) {

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

    return total === 0 ? 0 : Math.round((present / total) * 100)
}


/* -------- Toggle -------- */

function handleToggle(toggle) {

    const row = toggle.closest("tr")
    const reasonBox = row.querySelector(".reasonBox")

    if (toggle.checked !== toggle.defaultChecked) {
        reasonBox.style.display = "block"
    } else {
        reasonBox.style.display = "none"
        reasonBox.value = ""
    }

    row.style.background = toggle.checked ? "#dcfce7" : "#fee2e2"
}


/* -------- Load Attendance -------- */

function loadAttendance() {

    const date = dateDropdown.value
    const time = timeDropdown.value

    if (!date || !time) {
        showMessage("Select date & time", "error")
        return
    }

    const key = `${getBaseKey()}_${date}_${time}`
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

        toggle.defaultChecked = toggle.checked
        toggle.addEventListener("change", () => handleToggle(toggle))
        handleToggle(toggle)
    })

    showMessage("Attendance loaded 🎉", "success")
}


/* -------- Bulk -------- */

function markAllEdit(status) {

    document.querySelectorAll(".toggle-switch input").forEach(toggle => {
        toggle.checked = (status === "Present")
        handleToggle(toggle)
    })

    showMessage(`All marked ${status} ✅`, "success")
}


/* -------- Update -------- */

function updateAttendance() {

    const date = dateDropdown.value
    const time = timeDropdown.value

    if (!date || !time) {
        showMessage("Select date & time", "error")
        return
    }

    let attendanceData = []
    let reasonMissing = false

    document.querySelectorAll("#studentRows tr").forEach(row => {

        const toggle = row.querySelector(".toggle-switch input")
        const reasonBox = row.querySelector(".reasonBox")

        if (toggle.checked !== toggle.defaultChecked && reasonBox.value.trim() === "") {
            reasonMissing = true
            reasonBox.style.border = "1px solid red"
        }

        attendanceData.push({
            usn: toggle.dataset.usn,
            status: toggle.checked ? "Present" : "Absent"
        })
    })

    if (reasonMissing) {
        showMessage("Enter reason for changes", "error")
        return
    }

    const key = `${getBaseKey()}_${date}_${time}`

    localStorage.setItem(key, JSON.stringify({
        data: attendanceData
    }))

    showMessage("Updated successfully ✅", "success")

    setTimeout(() => {
        window.location.href = "attendance.html"
    }, 1200)
}


/* -------- INIT -------- */

console.log("Edit page loaded ✅")

dateDropdown.addEventListener("change", loadTimesForDate)


/* -------- Back -------- */

function goBack() {
    window.location.href = "attendance.html"
}