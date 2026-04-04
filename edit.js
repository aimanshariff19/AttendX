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

/* -------- BUTTON -------- */
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

/* -------- 🔥 TIME NORMALIZE -------- */
function normalizeTime(t) {
    if (!t) return ""
    t = t.trim()
    let [h, m] = t.split(":")
    h = String(parseInt(h)).padStart(2, "0")
    return `${h}:${m}`
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

    timeDropdown.innerHTML = ""

    if (times.length === 0) {
        timeDropdown.innerHTML = "<option>No classes</option>"
        return
    }

    timeDropdown.innerHTML = "<option value=''>Select time</option>"

    times.forEach(time => {
        const option = document.createElement("option")
        option.value = time
        option.textContent = formatTimeRange(time) // 🔥 RANGE FORMAT
        timeDropdown.appendChild(option)
    })

    checkEnableUpdate()
}

/* -------- LOAD ATTENDANCE -------- */
function loadAttendance() {

    const btn = event?.target || document.activeElement
    setBtnLoading(btn)

    setTimeout(() => {

        const date = dateDropdown.value
        const time = normalizeTime(timeDropdown.value)

        if (!date || !time) {
            showMessage("Select date & time first ❌", "error")
            resetBtn(btn)
            return
        }

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
    setBtnLoading(btn)

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

/* 🔥 disable initially */
if (updateBtn) {
    updateBtn.disabled = true
    updateBtn.style.opacity = "0.5"
}