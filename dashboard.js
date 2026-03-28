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

/* -------- Students -------- */

const classKey = `${department}_${program}_${sem}_${section}`
const studentList = students[classKey] || []
const table = document.getElementById("studentRows")

function loadStudents() {

    table.innerHTML = ""

    studentList.forEach(student => {

        let row = document.createElement("tr")

        row.innerHTML = `
            <td>${student.usn}</td>
            <td>${student.name}</td>
            <td>-</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" data-usn="${student.usn}" checked>
                    <span class="slider"></span>
                </label>
            </td>
        `

        table.appendChild(row)
    })
}

/* -------- Submit Attendance (NO TIME) -------- */

function submitAttendance() {

    // Only date (NO TIME anywhere)
    const date = new Date().toISOString().split("T")[0]

    const key = `${subject}_${department}_${program}_${sem}_${section}_${date}`

    let data = []

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        data.push({
            usn: input.dataset.usn,
            status: input.checked ? "Present" : "Absent"
        })
    })

    localStorage.setItem(key, JSON.stringify({ data }))

    // 🔥 cleaner than alert
    showSuccessMessage("Attendance Submitted ✅")
}

/* -------- Message (NO ALERTS) -------- */

function showSuccessMessage(text) {
    let box = document.getElementById("messageBox")

    if (!box) {
        alert(text) // fallback
        return
    }

    box.innerText = text
    box.style.display = "block"
    box.style.background = "#dcfce7"
    box.style.color = "#166534"

    setTimeout(() => {
        box.style.display = "none"
    }, 2000)
}

/* -------- INIT -------- */

window.onload = function () {
    loadStudents()
}