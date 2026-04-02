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

/* -------- FORMAT TIME -------- */

function formatTo12Hour(time24) {
    if (!time24) return "--"

    let [hour, minute] = time24.split(":").map(Number)
    let ampm = hour >= 12 ? "PM" : "AM"
    hour = hour % 12 || 12

    return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`
}

/* -------- CONVERT 12 → 24 -------- */

function convertTo24Hour(time12) {
    if (!time12) return ""
    if (!time12.includes("AM") && !time12.includes("PM")) return time12

    const [time, modifier] = time12.split(" ")
    let [hours, minutes] = time.split(":").map(Number)

    if (modifier === "PM" && hours !== 12) hours += 12
    if (modifier === "AM" && hours === 12) hours = 0

    return `${String(hours).padStart(2, "0")}:${minutes}`
}

/* -------- CLASS DETAILS -------- */

const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program") || ""
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

/* -------- MESSAGE -------- */

function showMessage(text, type) {
    const box = document.getElementById("messageBox")
    if (!box) return

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => box.style.display = "none", 2500)
}

/* -------- LOAD TIMES -------- */

function loadTimesForDate() {

    const date = dateDropdown.value

    if (!date) {
        timeDropdown.innerHTML = "<option value=''>Select date first</option>"
        return
    }

    let times = []
    timeDropdown.innerHTML = ""

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i)
        if (!key) continue

        if (key.includes(subject) && key.includes(date)) {

            const parts = key.split("_")
            const keyDate = parts[parts.length - 2]
            const keyTime = parts[parts.length - 1]

            if (keyDate === date) {
                times.push(keyTime.trim())
            }
        }
    }

    times = [...new Set(times)].sort((a, b) => a.localeCompare(b))

    if (times.length === 0) {
        timeDropdown.innerHTML = "<option value=''>No classes available</option>"
        return
    }

    timeDropdown.innerHTML = "<option value=''>Select time</option>"

    times.forEach((time, index) => {
        const option = document.createElement("option")
        option.value = time
        option.textContent = `${formatTo12Hour(time)} (Class ${index + 1})`
        timeDropdown.appendChild(option)
    })
}

/* -------- LOAD ATTENDANCE -------- */

function loadAttendance() {

    const btn = event?.target || document.activeElement
    const originalText = btn.innerText

    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        const date = dateDropdown.value
        let time = timeDropdown.value.trim()

        time = convertTo24Hour(time)

        if (!date || !time) {
            showMessage("Select date & time", "error")
            btn.classList.remove("loading")
            btn.innerText = originalText
            return
        }

        const key = `${subject}_${department}_${program}_${sem}_${section}_${date}_${time}`

        console.log("Loading Key:", key)

        const saved = JSON.parse(localStorage.getItem(key))

        if (!saved) {
            showMessage("Attendance not found", "error")
            btn.classList.remove("loading")
            btn.innerText = originalText
            return
        }

        const records = saved.data || saved
        table.innerHTML = ""

        studentsList.forEach((student) => {

            const record = records.find(r => r.usn === student.usn)
            const isPresent = record && record.status === "Present"

            let row = document.createElement("tr")

            row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>
<td>--</td>

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

        document.querySelectorAll(".toggle-switch input").forEach(toggle => {
            toggle.defaultChecked = toggle.checked
            toggle.addEventListener("change", () => handleToggle(toggle))
            handleToggle(toggle)
        })

        btn.classList.remove("loading")
        btn.innerText = originalText

        showMessage("Attendance loaded 🎉", "success")

    }, 600)
}

/* -------- TOGGLE -------- */

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

/* -------- UPDATE -------- */

function updateAttendance() {

    const btn = document.querySelector(".update-btn")
    const originalText = btn.innerText

    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        const date = dateDropdown.value
        let time = timeDropdown.value.trim()

        time = convertTo24Hour(time)

        if (!date || !time) {
            showMessage("Select date & time", "error")
            btn.classList.remove("loading")
            btn.innerText = originalText
            return
        }

        let attendanceData = []

        document.querySelectorAll("#studentRows tr").forEach(row => {
            const toggle = row.querySelector(".toggle-switch input")

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

    }, 800)
}

/* -------- INIT -------- */

dateDropdown.addEventListener("change", loadTimesForDate)