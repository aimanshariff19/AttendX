/* -------- 🔥 GET % -------- */
function getStudentPercent(usn) {
    let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}
    const subjectData = db?.[classKey]?.[subject] || []

    let total = 0
    let present = 0

    subjectData.forEach(day => {
        if (day.records[usn]) {
            total++
            if (day.records[usn] === "Present") present++
        }
    })

    return total === 0 ? 100 : Math.round((present / total) * 100)
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

/* -------- 🔥 BUTTON WITH TEXT SPINNER -------- */
function setBtnLoading(btn, text = "Loading...") {
    if (!btn || btn.classList.contains("loading")) return

    btn.dataset.original = btn.innerHTML
    btn.classList.add("loading")

    btn.innerHTML = `
        <span>${text}</span>
        <span class="btn-spinner"></span>
    `
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    if (btn.dataset.original) {
        btn.innerHTML = btn.dataset.original
    }
}

/* -------- 🔥 SHAKE -------- */
function triggerShake(el) {
    if (!el) return
    el.classList.add("shake")
    setTimeout(() => el.classList.remove("shake"), 400)
}

/* -------- 🔥 FIELD ERROR (TOP FIXED) -------- */
function showFieldError(input, message) {
    if (!input) return

    triggerShake(input)
    input.classList.add("input-error")

    let parent = input.parentElement

    // remove old
    let old = parent.querySelector(".field-error")
    if (old) old.remove()

    const err = document.createElement("div")
    err.className = "field-error"
    err.innerText = message

    // 🔥 KEY FIX: top overlay positioning
    parent.style.position = "relative"

    err.style.position = "absolute"
    err.style.top = "-20px"
    err.style.right = "0"
    err.style.fontSize = "12px"
    err.style.color = "#ef4444"
    err.style.pointerEvents = "none"

    parent.appendChild(err)

    setTimeout(() => {
        input.classList.remove("input-error")
        err.remove()
    }, 2000)
}

/* -------- 🔥 TIME NORMALIZE -------- */
function normalizeTime(t) {
    if (!t) return ""
    t = t.trim()
    let [h, m] = t.split(":")
    h = String(parseInt(h)).padStart(2, "0")
    return `${h}:${m}`
}

/* -------- 🔥 SORT TIME -------- */
function sortTimes(times) {
    return times.sort((a, b) => {
        const [h1, m1] = a.split(":").map(Number)
        const [h2, m2] = b.split(":").map(Number)
        return h1 * 60 + m1 - (h2 * 60 + m2)
    })
}

/* -------- 🔥 FORMAT RANGE -------- */
function formatTimeRange(time) {
    if (!time) return "--"

    let [h, m] = time.split(":").map(Number)

    let start = new Date()
    start.setHours(h, m)

    let end = new Date(start)
    end.setHours(end.getHours() + 1)

    const format = (d) => {
        let hr = d.getHours()
        const min = String(d.getMinutes()).padStart(2, "0")
        const ampm = hr >= 12 ? "PM" : "AM"
        hr = hr % 12 || 12
        return `${hr}:${min} ${ampm}`
    }

    return `${format(start)} - ${format(end)}`
}

/* -------- CLASS DETAILS -------- */
const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program") || ""
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

setText("subject", subject)
setText("department", department)
setText("program", program)
setText("sem", sem)
setText("section", section)

const classKey = `${department}_${program}_${sem}_${section}`
const studentsList = students[classKey] || []

const dateDropdown = document.getElementById("attendanceDate")
const table = document.getElementById("studentRows")
const timeDropdown = document.getElementById("timeSelect")
const updateBtn = document.querySelector(".update-btn")

/* -------- MESSAGE -------- */
function showMessage(text, type) {
    const box = document.getElementById("messageBox")
    if (!box) return

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => box.style.display = "none", 2500)
}

/* -------- 🔥 DISABLE BUTTON -------- */
function checkEnableUpdate() {
    if (!updateBtn) return

    if (dateDropdown.value && timeDropdown.value) {
        updateBtn.disabled = false
        updateBtn.style.opacity = "1"
    } else {
        updateBtn.disabled = true
        updateBtn.style.opacity = "0.5"
    }
}

/* -------- LOAD TIMES -------- */
function loadTimesForDate() {

    const date = dateDropdown.value
    let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}

    const subjectData = db?.[classKey]?.[subject] || []

    let times = subjectData
        .filter(a => a.date === date)
        .map(a => normalizeTime(a.time))

    times = [...new Set(times)]
    times = sortTimes(times)

    timeDropdown.innerHTML = ""

    if (times.length === 0) {
        timeDropdown.innerHTML = "<option>No classes</option>"
        return
    }

    timeDropdown.innerHTML = "<option value=''>Select time</option>"

    times.forEach(time => {
        const option = document.createElement("option")
        option.value = time
        option.textContent = formatTimeRange(time)
        timeDropdown.appendChild(option)
    })

    checkEnableUpdate()
}

/* -------- LOAD ATTENDANCE -------- */
function loadAttendance(event) {

    const btn = event?.target || document.activeElement

    const date = dateDropdown.value
    const time = normalizeTime(timeDropdown.value)

    if (!date || !time) {

        if (!date) showFieldError(dateDropdown, "Select Date")
        if (!time) showFieldError(timeDropdown, "Select Time Slot")

        showMessage("Select date & time first ❌", "error")
        return
    }

    setBtnLoading(btn, "Loading...")

    setTimeout(() => {

        let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}
        const subjectData = db?.[classKey]?.[subject] || []

        const entry = subjectData.find(a =>
            a.date === date &&
            normalizeTime(a.time) === time
        )

        if (!entry) {
            showMessage("Attendance not found ❌", "error")
            resetBtn(btn)
            return
        }

        table.innerHTML = ""

        studentsList.forEach(student => {

            const status = entry.records[student.usn] || "Absent"
            const percent = getStudentPercent(student.usn)

            let row = document.createElement("tr")

            row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>

<td>
    <span class="percent-text">${percent}%</span>
    <div class="bar">
        <div class="fill" style="width:${percent}%"></div>
    </div>
</td>

<td>
<button class="status-btn ${status === "Present" ? "present" : "absent"} active"
onclick="toggleStatus(this)">
${status}
</button>
</td>
`

            table.appendChild(row)
        })

        resetBtn(btn)
        showMessage("Loaded ✅", "success")

    }, 500)
}

/* -------- TOGGLE -------- */
function toggleStatus(btn) {
    const isPresent = btn.classList.contains("present")

    btn.classList.remove("present", "absent")

    if (isPresent) {
        btn.classList.add("absent")
        btn.innerText = "Absent"
    } else {
        btn.classList.add("present")
        btn.innerText = "Present"
    }
}

/* -------- UPDATE -------- */
function updateAttendance() {

    if (!dateDropdown.value || !timeDropdown.value) {

        if (!dateDropdown.value) showFieldError(dateDropdown, "Select Date")
        if (!timeDropdown.value) showFieldError(timeDropdown, "Select Time Slot")

        showMessage("Select date & time first ❌", "error")
        return
    }

    const btn = updateBtn
    setBtnLoading(btn, "Updating...")

    setTimeout(() => {
        window.location.href = "attendance.html"
    }, 700)
}

/* -------- INIT -------- */
dateDropdown.addEventListener("change", () => {
    loadTimesForDate()
    checkEnableUpdate()
})

timeDropdown.addEventListener("change", checkEnableUpdate)

if (updateBtn) {
    updateBtn.disabled = true
    updateBtn.style.opacity = "0.5"
}