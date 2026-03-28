/* -------- Class details -------- */

const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program")
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


/* -------- Students -------- */

// ❗ FIXED template string
const classKey = `${department}_${program}_${sem}_${section}`

// ❗ SAFE students check
const studentList = (typeof students !== "undefined" && students[classKey])
    ? students[classKey]
    : []

const table = document.getElementById("studentRows")


/* -------- Calculate % -------- */

function calculatePercentage(usn, currentStatus = null) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.includes(subject)) {

            let stored = JSON.parse(localStorage.getItem(key) || "{}")
            let records = stored.data || stored

            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    if (currentStatus !== null) {
        total++
        if (currentStatus === "Present") present++
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}


/* -------- Load Students -------- */

function loadStudents() {

    if (!table) return   // ✅ prevents crash

    table.innerHTML = ""

    studentList.forEach(student => {

        let percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

        // ❗ FIXED HTML template
        row.innerHTML = `
            <td>${student.usn}</td>
            <td>${student.name}</td>
            <td class="percent">${percent}%</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" data-usn="${student.usn}" checked>
                    <span class="slider"></span>
                </label>
            </td>
        `

        updateRowStyle(row, percent, true)

        table.appendChild(row)
    })

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.addEventListener("change", updateLivePercentage)
    })
}


/* -------- Row Styling -------- */

function updateRowStyle(row, percent, isPresent) {

    if (percent < 75) {
        row.style.borderLeft = "5px solid red"
    } else {
        row.style.borderLeft = "none"
    }

    row.style.background = isPresent ? "#dcfce7" : "#fee2e2"
}


/* -------- Live Update -------- */

function updateLivePercentage() {

    document.querySelectorAll("#studentRows tr").forEach(row => {

        const input = row.querySelector("input")
        const usn = input.dataset.usn
        const percentCell = row.querySelector(".percent")

        const status = input.checked ? "Present" : "Absent"

        let percent = calculatePercentage(usn, status)

        percentCell.innerText = percent + "%"

        updateRowStyle(row, percent, input.checked)
    })
}


/* -------- Submit Attendance -------- */

function submitAttendance() {

    const btn = document.getElementById("submitBtn")

    const date = new Date().toISOString().split("T")[0]

    // ❗ FIXED template string
    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}`

    if (localStorage.getItem(key)) {
        showMessage("Already submitted for today ❌", "error")
        return
    }

    let data = []

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        data.push({
            usn: input.dataset.usn,
            status: input.checked ? "Present" : "Absent"
        })
    })

    localStorage.setItem(key, JSON.stringify({ data }))

    if (btn) {
        btn.innerText = "Submitted ✅"
        btn.disabled = true
    }

    showMessage("Attendance Submitted ✅", "success")
}


/* -------- Message -------- */

function showMessage(text, type) {

    let box = document.getElementById("messageBox")

    if (!box) {
        alert(text)
        return
    }

    box.innerText = text
    box.style.display = "block"

    if (type === "success") {
        box.style.background = "#dcfce7"
        box.style.color = "#166534"
    } else {
        box.style.background = "#fee2e2"
        box.style.color = "#991b1b"
    }

    setTimeout(() => {
        box.style.display = "none"
    }, 2500)
}


/* -------- INIT -------- */

document.addEventListener("DOMContentLoaded", loadStudents)

function loadCourseCards() {

    const container = document.getElementById("courseCards")
    if (!container) return

    container.innerHTML = ""

    if (typeof timetable === "undefined") {
        container.innerHTML = "<p>No data available</p>"
        return
    }

    const unique = []

    timetable.forEach(cls => {

        const key = `${cls.subject}_${cls.program}_${cls.sem}_${cls.section}`

        if (!unique.find(u => u.key === key)) {
            unique.push({ ...cls, key })
        }
    })

    unique.forEach(course => {

        const card = document.createElement("div")
        card.className = "card"

        card.innerHTML = `
            <p><strong>Subject:</strong> ${course.subject}</p>
            <p><strong>Branch:</strong> ${course.program}</p>
            <p><strong>Semester:</strong> ${course.sem}</p>
            <p><strong>Section:</strong> ${course.section}</p>

            <button onclick="openCourse('${course.subject}','${course.program}','${course.sem}','${course.section}')">
                View
            </button>
        `

        container.appendChild(card)
    })
}

function openCourse(subject, program, sem, section) {
    localStorage.setItem("subject", subject)
    localStorage.setItem("program", program)
    localStorage.setItem("sem", sem)
    localStorage.setItem("section", section)

    window.location.href = "attendance.html"
}

document.addEventListener("DOMContentLoaded", loadCourseCards)