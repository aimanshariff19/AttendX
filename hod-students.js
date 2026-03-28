/* -------- Class Details -------- */

const department = localStorage.getItem("department")
const program = localStorage.getItem("program")
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

document.getElementById("department").innerText = department
document.getElementById("program").innerText = program
document.getElementById("sem").innerText = sem
document.getElementById("section").innerText = section

/* -------- Students -------- */

const classKey = `${department}_${program}_${sem}_${section}`
const studentList = students[classKey] || []

const table = document.getElementById("studentRows")
const tableHead = document.getElementById("tableHead")

/* -------- Subjects -------- */

const classSubjects = courses.filter(course =>
    course.department === department &&
    course.program === program &&
    course.sem.toString() === sem.toString() &&
    course.section === section
)

/* -------- Create Subject Columns -------- */

function loadSubjectHeaders() {

    classSubjects.forEach(sub => {

        let th = document.createElement("th")
        th.innerText = sub.subject

        tableHead.appendChild(th)

    })

}

/* -------- Calculate Attendance -------- */

function calculatePercentage(usn, subject) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key.startsWith(`${subject}_${department}_${program}_${sem}_${section}_`)) {

            let data = JSON.parse(localStorage.getItem(key) || "[]")

            let record = data.find(r => r.usn === usn)

            if (record) {

                total++

                if (record.status === "Present") {
                    present++
                }

            }

        }

    }

    if (total === 0) return 0

    return Math.round((present / total) * 100)

}

/* -------- Color Logic -------- */

function getColor(percent) {

    if (percent >= 85) return "eligible"

    if (percent >= 75) return "average"

    return "not-eligible"

}

/* -------- Load Students -------- */

function loadStudents() {

    table.innerHTML = ""

    studentList.forEach(student => {

        let row = `

<tr>

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

/* -------- Initial Load -------- */

window.onload = function () {

    loadSubjectHeaders()
    loadStudents()

}

/* -------- Auto Refresh -------- */

window.addEventListener("storage", () => {
    loadStudents()
})

/* -------- Back Button -------- */

function goBack() {
    window.location.href = "hod-dashboard.html"
}

/* -------- Export to Excel -------- */

function exportClassReport() {

    const rows = document.querySelectorAll("#studentRows tr")

    if (rows.length === 0) {
        alert("No data to export")
        return
    }

    let csv = "USN,Name,Parent Phone\n"

    rows.forEach(row => {
        const cols = row.querySelectorAll("td")

        let usn = cols[0]?.innerText || ""
        let name = cols[1]?.innerText || ""
        let phone = cols[2]?.innerText || ""

        csv += `${usn},${name},${phone}\n`
    })

    // Create file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "class_report.csv"
    a.click()

    URL.revokeObjectURL(url)
}
