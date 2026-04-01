/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text) {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerHTML
    btn.classList.add("loading")
    btn.innerHTML = `${text} <span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    btn.classList.remove("loading")
    btn.innerHTML = btn.dataset.original
}

/* -------- 🔥 SHAKE FUNCTION -------- */
function triggerShake(el) {
    if (!el) return
    el.classList.add("shake")
    setTimeout(() => el.classList.remove("shake"), 400)
}

/* -------- 🔥 ERROR MESSAGE (ADDED) -------- */
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

        let row = document.createElement("tr")

        row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>

<td>
    <span class="percent-text">100%</span>
    <div class="bar">
        <div class="fill" style="width:100%"></div>
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

/* -------- TOGGLE -------- */
function toggleStatus(btn) {

    const row = btn.closest("tr")
    const isPresent = btn.classList.contains("present")

    btn.classList.remove("present", "absent", "active")

    if (isPresent) {
        btn.classList.add("absent", "active")
        btn.innerText = "Absent"
    } else {
        btn.classList.add("present", "active")
        btn.innerText = "Present"
    }

    row.style.background = btn.classList.contains("present")
        ? "rgba(34,197,94,0.08)"
        : "rgba(239,68,68,0.08)"
}

/* -------- SUBMIT (FINAL FIX) -------- */
function submitAttendance(btn) {

    if (!btn) btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const time = document.getElementById("classTime")?.value

    if (!date) {
        triggerShake(document.getElementById("date"))
        triggerShake(btn)
        showError("Select Date")
        return
    }

    if (!time) {
        triggerShake(document.getElementById("classTime"))
        triggerShake(btn)
        showError("Select Time")
        return
    }

    setBtnLoading(btn, "Submitting")

    setTimeout(() => {
        window.location.href = "dashboard.html"
    }, 800)
}

/* -------- INIT -------- */
window.onload = function () {

    table = document.getElementById("studentRows")

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange)

    initStudents()
    loadStudents()
}