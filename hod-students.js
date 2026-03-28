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

/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- UNIVERSAL GET -------- */
function getAttendanceRecords(key) {
    let stored = JSON.parse(localStorage.getItem(key) || "{}")
    return stored.data || []
}

/* -------- MESSAGE -------- */
function showMessage(text, type = "success") {
    let box = document.getElementById("messageBox")

    if (!box) {
        box = document.createElement("div")
        box.id = "messageBox"
        box.className = "message-box"
        document.querySelector(".dashboard").prepend(box)
    }

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 2500)
}

/* -------- CLASS DETAILS -------- */
const department = localStorage.getItem("department")
const program = localStorage.getItem("program")
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

document.getElementById("department").innerText = department
document.getElementById("program").innerText = program
document.getElementById("sem").innerText = sem
document.getElementById("section").innerText = section

/* -------- STUDENT MATCH -------- */
let studentList = []

for (let key in students) {

    const parts = key.split("_")
    if (parts.length !== 4) continue

    const [d, p, s, sec] = parts

    const cleanP1 = p.replace(".", "").toLowerCase()
    const cleanP2 = program.replace(".", "").toLowerCase()

    if (
        d === department &&
        cleanP1 === cleanP2 &&
        s.toString() === sem.toString() &&
        sec === section
    ) {
        studentList = students[key]
        break
    }
}

/* -------- TABLE -------- */
const table = document.getElementById("studentRows")
const tableHead = document.getElementById("tableHead")

/* -------- SUBJECTS -------- */
const classSubjects = courses.filter(course =>
    course.department === department &&
    course.program === program &&
    course.sem.toString() === sem.toString() &&
    course.section === section
)

/* -------- SUBJECT HEADERS -------- */
function loadSubjectHeaders() {

    classSubjects.forEach(sub => {

        let th = document.createElement("th")
        th.innerText = sub.subject

        tableHead.appendChild(th)

    })

}

/* -------- FIXED CALCULATE -------- */
function calculatePercentage(usn, subject) {

    let present = 0
    let total = 0

    const base = `${normalize(subject)}_${normalize(department)}_${normalize(program)}_${sem}_${normalize(section)}`

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

    if (total === 0) return 0
    return Math.round((present / total) * 100)
}

/* -------- COLOR -------- */
function getColor(percent) {

    if (percent >= 85) return "eligible"
    if (percent >= 75) return "average"
    return "not-eligible"
}

/* -------- LOAD STUDENTS -------- */
function loadStudents() {

    table.innerHTML = ""

    if (studentList.length === 0) {
        showMessage("No students found ⚠️", "error")
        return
    }

    studentList.forEach((student, index) => {

        let row = `
<tr style="animation: fadeUp ${0.3 + index * 0.05}s ease">
<td>${student.usn}</td>
<td>${student.name}</td>
<td>${student.parentPhone || "-"}</td>
`

        classSubjects.forEach(sub => {

            let percent = calculatePercentage(student.usn, sub.subject)
            let colorClass = getColor(percent)

            row += `<td class="${colorClass}">${percent}%</td>`

        })

        row += "</tr>"

        table.innerHTML += row
    })
}

/* -------- INIT -------- */
window.onload = function () {
    loadSubjectHeaders()
    loadStudents()
}

/* -------- AUTO REFRESH -------- */
window.addEventListener("storage", () => {
    loadStudents()
})

/* -------- BACK -------- */
function goBack() {

    document.querySelector(".dashboard").classList.add("page-exit")

    setTimeout(() => {
        window.location.href = "hod-dashboard.html"
    }, 400)
}

/* -------- EXPORT -------- */
function exportClassReport() {

    const btn = document.getElementById("exportBtn")

    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        if (studentList.length === 0) {
            showMessage("No data to export ❌", "error")
            btn.classList.remove("loading")
            btn.innerText = "Export Class Report"
            return
        }

        let csv = "USN,Name,Parent Phone"

        classSubjects.forEach(sub => {
            csv += `,${sub.subject}`
        })

        csv += "\n"

        studentList.forEach(student => {

            let row = `${student.usn},${student.name},${student.parentPhone || "-"}`

            classSubjects.forEach(sub => {
                let percent = calculatePercentage(student.usn, sub.subject)
                row += `,${percent}%`
            })

            csv += row + "\n"
        })

        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = "class_report.csv"
        a.click()

        URL.revokeObjectURL(url)

        btn.classList.remove("loading")
        btn.innerText = "Export Class Report"

        showMessage("Export successful 📁", "success")

    }, 700)
}