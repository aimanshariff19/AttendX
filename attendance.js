/* -------- 🔥 FIX STUCK SPINNER (BFCACHE) -------- */
window.addEventListener("pageshow", function () {
    document.querySelectorAll(".loading").forEach(btn => {
        btn.classList.remove("loading")
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original
        }
    })
})

/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text = "Loading") {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerHTML
    btn.classList.add("loading")
    btn.innerHTML = `${text} <span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    if (btn.dataset.original) {
        btn.innerHTML = btn.dataset.original
    }
}

/* -------- 🔥 SHAKE FUNCTION -------- */
function triggerShake(el) {
    if (!el) return
    el.classList.add("shake")
    setTimeout(() => el.classList.remove("shake"), 400)
}

/* -------- 🔥 ERROR MESSAGE -------- */
function showError(msg) {
    let box = document.getElementById("errorBox")

    if (!box) {
        box = document.createElement("div")
        box.id = "errorBox"
        box.style.position = "fixed"
        box.style.top = "20px"
        box.style.left = "50%"
        box.style.transform = "translateX(-50%)"
        box.style.background = "#ef4444"
        box.style.color = "white"
        box.style.padding = "10px 16px"
        box.style.borderRadius = "8px"
        box.style.fontSize = "13px"
        box.style.zIndex = "999"
        document.body.appendChild(box)
    }

    box.innerText = msg
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 2000)
}

/* -------- 🔥 CURRENT TIME -------- */
function updateCurrentTime() {
    const now = new Date()
    let h = now.getHours()
    const m = String(now.getMinutes()).padStart(2, "0")
    const ampm = h >= 12 ? "PM" : "AM"
    h = h % 12
    h = h ? h : 12

    const el = document.getElementById("currentTime")
    if (el) el.value = `${h}:${m} ${ampm}`
}

/* -------- 🔥 CONVERT 12 → 24 -------- */
function convertTo24Hour(time12) {
    if (!time12) return ""
    if (!time12.includes("AM") && !time12.includes("PM")) return time12

    const [time, modifier] = time12.split(" ")
    let [hours, minutes] = time.split(":").map(Number)

    if (modifier === "PM" && hours !== 12) hours += 12
    if (modifier === "AM" && hours === 12) hours = 0

    return `${String(hours).padStart(2, "0")}:${minutes}`
}

/* -------- 🔥 TIME RANGE -------- */
function calculateTimeRange() {
    const start = document.getElementById("classTime")?.value
    const num = parseInt(document.getElementById("numClasses")?.value)

    if (!start || !num) return

    let [h, m] = start.split(":").map(Number)

    let startDate = new Date()
    startDate.setHours(h, m)

    let endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + num * 60)

    const format12 = (d) => {
        let hr = d.getHours()
        const min = String(d.getMinutes()).padStart(2, "0")
        const ampm = hr >= 12 ? "PM" : "AM"
        hr = hr % 12
        hr = hr ? hr : 12
        return `${hr}:${min} ${ampm}`
    }

    const el = document.getElementById("timeRange")
    if (el) el.innerText = `${format12(startDate)} - ${format12(endDate)}`
}

/* -------- CLASS DETAILS -------- */
let subject = localStorage.getItem("subject") || "Data Structures"
let department = localStorage.getItem("department") || "CSE"
let program = localStorage.getItem("program") || "CSE"
let sem = localStorage.getItem("sem") || "3"
let section = localStorage.getItem("section") || "A"

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

setText("subject", subject)
setText("department", department)
setText("program", program)
setText("sem", sem)
setText("section", section)

/* -------- 🔥 NEW: GET STUDENT % -------- */
function getStudentStats(usn) {
    const classKey = `${department}_${program}_${sem}_${section}`
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

    let percent = total === 0 ? 100 : ((present / total) * 100).toFixed(0)

    return percent
}

/* -------- STUDENTS -------- */
let studentList = []
let table = null

function initStudents() {
    if (typeof students === "undefined") return
    const key = `${department}_${program}_${sem}_${section}`
    studentList = students[key] || []
}

/* -------- LOAD STUDENTS -------- */
function loadStudents() {

    if (!table) return
    table.innerHTML = ""

    if (studentList.length === 0) {
        table.innerHTML = `<tr><td colspan="4">No students</td></tr>`
        return
    }

    studentList.forEach((student) => {

        const percent = getStudentStats(student.usn)

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
    <button class="status-btn present active" onclick="toggleStatus(this)">
        Present
    </button>
</td>
`
        table.appendChild(row)
    })
}

/* -------- 🔥 TOGGLE -------- */
function toggleStatus(btn) {

    const row = btn.closest("tr")
    const percentText = row.querySelector(".percent-text")
    const fill = row.querySelector(".fill")

    const isPresent = btn.classList.contains("present")

    btn.classList.remove("present", "absent", "active")

    let status

    if (isPresent) {
        btn.classList.add("absent", "active")
        btn.innerText = "Absent"
        status = "Absent"
    } else {
        btn.classList.add("present", "active")
        btn.innerText = "Present"
        status = "Present"
    }

    const percent = status === "Present" ? 100 : 0

    if (percentText) percentText.innerText = percent + "%"
    if (fill) fill.style.width = percent + "%"

    row.style.background = status === "Present"
        ? "rgba(34,197,94,0.08)"
        : "rgba(239,68,68,0.08)"
}

/* -------- 🔥 UPDATED SUBMIT -------- */
function submitAttendance(btn) {

    if (!btn) btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const time = document.getElementById("classTime")?.value

    if (!date) {
        triggerShake(document.getElementById("date"))
        showError("Select Date")
        return
    }

    if (!time) {
        triggerShake(document.getElementById("classTime"))
        showError("Select Time Slot")
        return
    }

    setBtnLoading(btn, "Submitting")

    setTimeout(() => {

        const rows = document.querySelectorAll("#studentRows tr")

        let records = {}

        rows.forEach(row => {
            const usn = row.children[0].innerText
            const b = row.querySelector(".status-btn")
            const status = b.classList.contains("present") ? "Present" : "Absent"

            records[usn] = status
        })

        const classKey = `${department}_${program}_${sem}_${section}`

        let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}

        if (!db[classKey]) db[classKey] = {}
        if (!db[classKey][subject]) db[classKey][subject] = []

        const exists = db[classKey][subject].find(a =>
            a.date === date && a.time === time
        )

        if (exists) {
            showError("Attendance already marked!")
            resetBtn(btn)
            return
        }

        db[classKey][subject].push({
            date,
            time,
            records
        })

        localStorage.setItem("attendanceDB", JSON.stringify(db))

        window.location.href = "dashboard.html"

    }, 800)
}

/* -------- 🔥 EDIT -------- */
function editAttendance(btn) {
    if (btn && btn.target) btn = btn.target
    setBtnLoading(btn, "Opening")
    setTimeout(() => {
        window.location.href = "edit-attendance.html"
    }, 400)
}

/* -------- 🔥 BACK -------- */
function goBack(btn) {
    if (btn && btn.target) btn = btn.target

    document.querySelectorAll(".loading").forEach(b => {
        if (b !== btn) resetBtn(b)
    })

    setBtnLoading(btn, "Going")

    setTimeout(() => {
        window.history.back()
    }, 250)
}

/* -------- 🔥 BULK -------- */
function markAll(isPresent, event) {

    let btn = event?.target || document.activeElement

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

            const percentText = row.querySelector(".percent-text")
            const fill = row.querySelector(".fill")

            const percent = isPresent ? 100 : 0

            if (percentText) percentText.innerText = percent + "%"
            if (fill) fill.style.width = percent + "%"
        })

        resetBtn(btn)

    }, 400)
}

/* -------- INIT -------- */
window.onload = function () {

    table = document.getElementById("studentRows")

    const dateInput = document.getElementById("date")
    const today = new Date().toISOString().split("T")[0]

    if (dateInput) {
        dateInput.value = today
        dateInput.setAttribute("readonly", true)
    }

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange)

    initStudents()
    loadStudents()
}