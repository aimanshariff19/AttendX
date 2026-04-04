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

/* -------- LOAD TIMES (SORTED) -------- */
function loadTimesForDate() {

    const date = dateDropdown.value
    let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}

    const subjectData = db?.[classKey]?.[subject] || []

    let times = subjectData
        .filter(a => a.date === date)
        .map(a => normalizeTime(a.time))

    times = [...new Set(times)]
    times = sortTimes(times) // 🔥 SORT FIX

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

    // 🔥 BLOCK BEFORE LOADING
    if (!date || !time) {
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

            let row = document.createElement("tr")

            row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>

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
        showMessage("Select date & time first ❌", "error")
        return
    }

    const btn = updateBtn
    setBtnLoading(btn, "Updating...")

    setTimeout(() => {

        const date = dateDropdown.value
        const time = normalizeTime(timeDropdown.value)

        let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}
        const subjectData = db?.[classKey]?.[subject] || []

        const entry = subjectData.find(a =>
            a.date === date &&
            normalizeTime(a.time) === time
        )

        if (!entry) {
            showMessage("Not found ❌", "error")
            resetBtn(btn)
            return
        }

        let newRecords = {}

        document.querySelectorAll("#studentRows tr").forEach(row => {
            const usn = row.children[0].innerText
            const btn = row.querySelector(".status-btn")

            newRecords[usn] =
                btn.classList.contains("present") ? "Present" : "Absent"
        })

        entry.records = newRecords
        localStorage.setItem("attendanceDB", JSON.stringify(db))

        resetBtn(btn)
        showMessage("Updated ✅", "success")

        setTimeout(() => {
            window.location.href = "attendance.html"
        }, 500)

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