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

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn) {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerText
    btn.classList.add("loading")
    btn.innerText = ""
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    btn.innerText = btn.dataset.original
}

/* -------- FORMAT TIME -------- */
function formatTo12Hour(time24) {
    if (!time24) return "--"
    let [hour, minute] = time24.split(":").map(Number)
    let ampm = hour >= 12 ? "PM" : "AM"
    hour = hour % 12 || 12
    return `${hour}:${String(minute).padStart(2, "0")} ${ampm}`
}

/* -------- CONVERT -------- */
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
    setBtnLoading(btn)

    setTimeout(() => {

        const date = dateDropdown.value
        let time = timeDropdown.value.trim()
        time = convertTo24Hour(time)

        if (!date || !time) {
            showMessage("Select date & time", "error")
            resetBtn(btn)
            return
        }

        const key = `${subject}_${department}_${program}_${sem}_${section}_${date}_${time}`
        const saved = JSON.parse(localStorage.getItem(key))

        if (!saved) {
            showMessage("Attendance not found", "error")
            resetBtn(btn)
            return
        }

        const records = saved.data || saved
        table.innerHTML = ""

        studentsList.forEach((student) => {

            const record = records.find(r => r.usn === student.usn)
            const isPresent = record && record.status === "Present"

            let row = document.createElement("tr")
            row.className = isPresent ? "present-row" : "absent-row"

            row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>
<td>--</td>

<td>
<button class="status-btn ${isPresent ? "present active" : "absent active"}"
onclick="toggleStatus(this)">
${isPresent ? "Present" : "Absent"}
</button>
</td>

<td>
<textarea class="reasonBox" style="display:none"></textarea>
</td>
`

            table.appendChild(row)
        })

        resetBtn(btn)
        showMessage("Attendance loaded 🎉", "success")

    }, 600)
}

/* -------- TOGGLE -------- */
function toggleStatus(btn) {

    const row = btn.closest("tr")
    const reasonBox = row.querySelector(".reasonBox")

    const isPresent = btn.classList.contains("present")

    btn.classList.remove("present", "absent", "active")

    if (isPresent) {
        btn.classList.add("absent", "active")
        btn.innerText = "Absent"
        row.className = "absent-row"
        reasonBox.style.display = "block"
    } else {
        btn.classList.add("present", "active")
        btn.innerText = "Present"
        row.className = "present-row"
        reasonBox.style.display = "none"
        reasonBox.value = ""
    }
}

/* -------- UPDATE -------- */
function updateAttendance() {

    const btn = document.querySelector(".update-btn")
    setBtnLoading(btn)

    setTimeout(() => {

        const date = dateDropdown.value
        let time = timeDropdown.value.trim()
        time = convertTo24Hour(time)

        if (!date || !time) {
            showMessage("Select date & time", "error")
            resetBtn(btn)
            return
        }

        let attendanceData = []

        document.querySelectorAll("#studentRows tr").forEach(row => {

            const btn = row.querySelector(".status-btn")

            attendanceData.push({
                usn: row.children[0].innerText,
                status: btn.classList.contains("present") ? "Present" : "Absent"
            })
        })

        const key = `${subject}_${department}_${program}_${sem}_${section}_${date}_${time}`

        localStorage.setItem(key, JSON.stringify({ data: attendanceData }))

        resetBtn(btn)
        showMessage("Updated successfully ✅", "success")

        setTimeout(() => {
            window.location.href = "attendance.html"
        }, 500)

    }, 800)
}

/* -------- INIT -------- */
dateDropdown.addEventListener("change", loadTimesForDate)

function markAll(isPresent, event) {

    // 🔥 get button from click
    let btn = event?.target

    if (!btn) btn = document.activeElement

    setBtnLoading(btn, isPresent ? "Marking Present" : "Marking Absent")

    setTimeout(() => {

        document.querySelectorAll("#studentRows tr").forEach(row => {

            const b = row.querySelector(".status-btn")
            if (!b) return

            b.classList.remove("present", "absent", "active")

            if (isPresent) {
                b.classList.add("present", "active")
                b.innerText = "Present"
                row.style.background = "rgba(34,197,94,0.08)"
            } else {
                b.classList.add("absent", "active")
                b.innerText = "Absent"
                row.style.background = "rgba(239,68,68,0.08)"
            }

            // 🔥 update %
            const percentText = row.querySelector(".percent-text")
            const fill = row.querySelector(".fill")

            const percent = isPresent ? 100 : 0

            if (percentText) percentText.innerText = percent + "%"
            if (fill) fill.style.width = percent + "%"
        })

        resetBtn(btn)

    }, 400) // smooth delay
}