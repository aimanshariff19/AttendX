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

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text = "Loading...") {
    if (!btn) return

    btn.classList.add("loading")
    btn.dataset.originalText = btn.innerHTML

    btn.innerHTML = `${text} <span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    if (!btn) return

    btn.classList.remove("loading")
    btn.innerHTML = btn.dataset.originalText || "Done"
}

/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
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

/* -------- STATE -------- */
let department = ""
let program = ""
let sem = ""
let section = ""
let studentList = []
let classSubjects = []
const table = document.getElementById("studentRows")
const tableHead = document.getElementById("tableHead")

/* -------- CLASS DETAILS -------- */
async function initClassDetails() {
    const params = getQueryParams()
    department = params.department || ""
    program = params.program || ""
    sem = params.sem || ""
    section = params.section || ""

    if (!department || !program || !sem || !section) {
        window.location.href = "hod-dashboard.html"
        return
    }

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section
}

/* -------- STUDENT MATCH -------- */

/* -------- SUBJECT HEADERS -------- */
function loadSubjectHeaders() {

    // 🔥 prevent duplicate headers
    while (tableHead.children.length > 3) {
        tableHead.removeChild(tableHead.lastChild)
    }

    classSubjects.forEach(sub => {
        let th = document.createElement("th")
        th.innerText = sub.subject
        tableHead.appendChild(th)
    })
}

/* -------- CALCULATE % -------- */
function calculatePercentage(usn, subject) {
    const subjectStats = studentList.find(s => s.usn === usn)?.subjects || {}
    return subjectStats[subject] || 0
}

/* -------- COLOR CLASS -------- */
function getColor(percent) {
    if (percent >= 85) return "high"
    if (percent >= 75) return "mid"
    return "low"
}

/* -------- LOAD STUDENTS -------- */
function loadStudents() {
    table.innerHTML = ""

    if (studentList.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="10" style="padding:20px; opacity:0.6;">
                    No students found ⚠️
                </td>
            </tr>
        `
        return
    }

    studentList.forEach((student, index) => {
        let row = `
<tr style="animation: fadeIn 0.4s ease">
<td>${student.usn}</td>
<td>${student.name}</td>
<td>${student.parentPhone || "-"}</td>
`

        classSubjects.forEach(sub => {
            let percent = calculatePercentage(student.usn, sub.subject)
            let colorClass = getColor(percent)
            let isDefaulter = percent < 75 ? "⚠️" : ""

            row += `<td class="${colorClass}">${percent}% ${isDefaulter}</td>`
        })

        row += "</tr>"
        table.innerHTML += row
    })
}

/* -------- INIT -------- */
window.onload = async function () {
    try {
        const user = await requireAuth('hod')
        if (!user) return

        await initClassDetails()

        // Fetch students with their stats
        const studentsData = await apiFetch(`/hod/students?program=${program}&sem=${sem}&section=${section}`)
        
        if (studentsData.courses) {
            classSubjects = studentsData.courses
        }
        
        if (studentsData.students) {
            studentList = studentsData.students
        }

        loadSubjectHeaders()
        loadStudents()
    } catch (err) {
        console.error(err)
        table.innerHTML = `
            <tr>
                <td colspan="10" style="padding:20px;color:#ef4444;">
                    ❌ Error loading data: ${err.message}
                </td>
            </tr>
        `
    }
}

/* -------- BACK -------- */
function goBack(btn) {

    setBtnLoading(btn, "Going...")

    setTimeout(() => {
        window.location.href = "hod-dashboard.html"
    }, 300)
}

/* -------- EXPORT -------- */
function exportClassReport(btn) {

    setBtnLoading(btn, "Exporting...")

    setTimeout(() => {

        if (studentList.length === 0) {
            showMessage("No data to export ❌", "error")
            resetBtn(btn)
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
        a.download = `attendance_${program}_${sem}_${section}.csv`
        a.click()

        URL.revokeObjectURL(url)

        resetBtn(btn)
        showMessage("Export successful 📁", "success")

    }, 700)
}