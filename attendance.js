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

/* -------- CLASS DETAILS (FIXED) -------- */
let subject = localStorage.getItem("subject") || "Data Structures"
let department = localStorage.getItem("department") || "CSE"
let program = localStorage.getItem("program") || "CSE"   // 🔥 FIX
let sem = localStorage.getItem("sem") || "3"
let section = localStorage.getItem("section") || "A"

if (!department) {
    department = localStorage.getItem("facultyDepartment") || "CSE"
}

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

setText("subject", subject)
setText("department", department)
setText("program", program)
setText("sem", sem)
setText("section", section)

/* -------- BASE KEY -------- */
function getBaseKey() {
    return `${normalize(subject)}_${normalize(department)}_${normalize(program)}_${sem}_${normalize(section)}`
}

/* -------- STORAGE -------- */
function getAttendanceRecords(key) {
    let stored = JSON.parse(localStorage.getItem(key) || "{}")
    return stored.data || []
}

/* -------- STUDENTS -------- */
let studentList = []
let table = null

function initStudents() {

    if (typeof students === "undefined") {
        console.error("❌ students not loaded")
        return
    }

    const key = `${department}_${program}_${sem}_${section}`

    console.log("🔥 Using key:", key)
    console.log("📦 Available keys:", Object.keys(students))

    studentList = students[key] || []

    if (studentList.length === 0) {
        console.warn("⚠ No students found for this key")
    }
}

/* -------- % CALC -------- */
function calculatePercentage(usn, currentStatus = null) {

    let present = 0
    let total = 0
    const base = getBaseKey()

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i)

        if (key && key.toLowerCase().startsWith(base)) {
            let records = getAttendanceRecords(key)
            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    total++
    if (currentStatus === null || currentStatus === "Present") {
        present++
    }

    return Math.round((present / total) * 100)
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

        let percent = calculatePercentage(student.usn, "Present")

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

/* -------- STATUS -------- */
function setStatus(btn, isPresent) {

    const row = btn.closest("tr")
    const buttons = row.querySelectorAll(".status-btn")

    buttons.forEach(b => b.classList.remove("active"))
    btn.classList.add("active")

    const percentText = row.querySelector(".percent-text")
    const fill = row.querySelector(".fill")

    const usn = row.children[0].innerText
    const status = isPresent ? "Present" : "Absent"

    let percent = calculatePercentage(usn, status)

    if (percentText) percentText.innerText = percent + "%"
    if (fill) fill.style.width = percent + "%"

    row.style.background = isPresent
        ? "rgba(34,197,94,0.08)"
        : "rgba(239,68,68,0.08)"
}

/* -------- INIT -------- */
window.onload = function () {

    table = document.getElementById("studentRows")

    const today = new Date().toISOString().split("T")[0]
    document.getElementById("date").value = today

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange)

    initStudents()
    loadStudents()
}