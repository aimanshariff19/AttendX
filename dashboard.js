/* -------- GitHub Pages FIX (Initial Data) -------- */

if (!localStorage.getItem("subject")) {
    localStorage.setItem("subject", "Math")
    localStorage.setItem("department", "CSE")
    localStorage.setItem("program", "BTech")
    localStorage.setItem("sem", "3")
    localStorage.setItem("section", "A")
}


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

// ✅ SAFE CHECK (prevents crash on GitHub Pages)
const studentList = (typeof students !== "undefined" && students[classKey])
    ? students[classKey]
    : []

const table = document.getElementById("studentRows")


// 🔥 DEBUG (remove later)
console.log("classKey:", classKey)
console.log("students:", typeof students !== "undefined" ? students : "NOT LOADED")
console.log("studentList:", studentList)


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

    // include current toggle
    if (currentStatus !== null) {
        total++
        if (currentStatus === "Present") present++
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}


/* -------- Load Students -------- */

function loadStudents() {

    if (!table) return

    table.innerHTML = ""

    if (studentList.length === 0) {
        table.innerHTML = `<tr><td colspan="4">No students found</td></tr>`
        return
    }

    studentList.forEach(student => {

        let percent = calculatePercentage(student.usn)

        let row = document.createElement("tr")

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

    row.style.borderLeft = percent < 75 ? "5px solid red" : "none"
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

window.onload = function () {
    loadStudents()
}