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

/* -------- Base Key -------- */

function getBaseKey() {
    return `${subject}_${department}_${program}_${sem}_${section}`
}

/* -------- Calculate % -------- */

function calculatePercentage(usn, currentStatus = null) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.startsWith(getBaseKey())) {

            let stored = JSON.parse(localStorage.getItem(key) || "{}")
            let records = stored.data || stored

            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    // include current session live toggle
    if (currentStatus !== null) {
        total++
        if (currentStatus === "Present") present++
    }

    return total === 0 ? 0 : Math.round((present / total) * 100)
}

/* -------- Load Students -------- */

function loadStudents() {

    table.innerHTML = ""

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

    updateStats()
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

    updateStats()
}

/* -------- Stats -------- */

function updateStats() {

    let total = 0
    let present = 0

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        total++
        if (input.checked) present++
    })

    document.getElementById("totalCount").innerText = total
    document.getElementById("presentCount").innerText = present
    document.getElementById("absentCount").innerText = total - present
}

/* -------- Submit Attendance -------- */

function submitAttendance() {

    const btn = document.getElementById("submitBtn")

    const date = document.getElementById("date").value
    const startTime = document.getElementById("classTime").value
    const numClasses = parseInt(document.getElementById("numClasses").value)

    if (!date || !startTime) {
        showMessage("Fill date & time properly ❌", "error")
        return
    }

    let [hour, minute] = startTime.split(":").map(Number)

    let submittedAny = false

    for (let i = 0; i < numClasses; i++) {

        const currentTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

        const key = `${getBaseKey()}_${date}_${currentTime}`

        if (localStorage.getItem(key)) {
            showMessage(`Already submitted for ${currentTime} ❌`, "error")
        } else {

            let data = []

            document.querySelectorAll(".toggle-switch input").forEach(input => {
                data.push({
                    usn: input.dataset.usn,
                    status: input.checked ? "Present" : "Absent"
                })
            })

            localStorage.setItem(key, JSON.stringify({ data }))
            submittedAny = true
        }

        hour += 1
    }

    if (submittedAny) {
        btn.innerText = "Submitted ✅"
        btn.disabled = true
        showMessage("Attendance Submitted ✅", "success")
    }
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

    box.className = "message-box " + (type === "success" ? "success" : "error")

    setTimeout(() => {
        box.style.display = "none"
    }, 2500)
}

/* -------- Button State Check -------- */

function checkSubmissionStatus() {

    const btn = document.getElementById("submitBtn")

    const date = document.getElementById("date").value
    const startTime = document.getElementById("classTime").value

    if (!date || !startTime) return

    const key = `${getBaseKey()}_${date}_${startTime}`

    if (localStorage.getItem(key)) {
        btn.innerText = "Already Submitted ✅"
        btn.disabled = true
    } else {
        btn.innerText = "Submit Attendance"
        btn.disabled = false
    }
}

/* -------- Bulk Actions -------- */

function markAll(status) {

    const isPresent = status === "Present"

    document.querySelectorAll(".toggle-switch input").forEach(input => {
        input.checked = isPresent
    })

    updateLivePercentage()
}

/* -------- INIT -------- */

window.onload = function () {

    loadStudents()

    document.getElementById("date").addEventListener("change", checkSubmissionStatus)
    document.getElementById("classTime").addEventListener("change", checkSubmissionStatus)
}