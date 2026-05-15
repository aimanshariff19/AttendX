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

let department = ""
let program = ""
let sem = ""
let section = ""
let cie1Date = ""
let cie2Date = ""
let studentList = []
let classSubjects = []

const cie1Table = document.getElementById("cie1StudentRows")
const cie2Table = document.getElementById("cie2StudentRows")
const cie1TableHead = document.getElementById("cie1TableHead")
const cie2TableHead = document.getElementById("cie2TableHead")

function cieStorageKey() {
    return `attendx_cie_${department}_${program}_${sem}_${section}`
}

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

    const saved = JSON.parse(localStorage.getItem(cieStorageKey()) || "{}")
    cie1Date = saved.cie1Date || ""
    cie2Date = saved.cie2Date || ""
    document.getElementById("cie1Date").value = cie1Date
    document.getElementById("cie2Date").value = cie2Date
}

function loadSubjectHeaders() {
    ;[cie1TableHead, cie2TableHead].forEach(head => {
        while (head.children.length > 3) {
            head.removeChild(head.lastChild)
        }

        classSubjects.forEach(sub => {
            const th = document.createElement("th")
            th.innerText = sub.subject
            head.appendChild(th)
        })
    })
}

function calculatePercentage(usn, subject) {
    const subjectStats = studentList.find(s => s.usn === usn)?.subjects || {}
    return subjectStats[subject] || 0
}

function calculateCiePercentage(usn, subject, key) {
    const stats = studentList.find(s => s.usn === usn)?.cie?.[subject] || {}
    return stats[key] ?? calculatePercentage(usn, subject)
}

function getColor(percent) {
    if (percent >= 85) return "high"
    if (percent >= 75) return "mid"
    return "low"
}

function emptyRowHtml() {
    const colspan = Math.max(3 + classSubjects.length, 4)
    return `
        <tr>
            <td colspan="${colspan}" style="padding:20px; opacity:0.6;">
                No students found
            </td>
        </tr>
    `
}

function renderCieRows(targetTable, cieKey) {
    targetTable.innerHTML = ""

    if (studentList.length === 0) {
        targetTable.innerHTML = emptyRowHtml()
        return
    }

    studentList.forEach((student) => {
        let row = `
<tr style="animation: fadeIn 0.4s ease">
<td>${student.usn}</td>
<td>${student.name}</td>
<td>${student.parentPhone || "-"}</td>
`

        classSubjects.forEach(sub => {
            const percent = calculateCiePercentage(student.usn, sub.subject, cieKey)
            const colorClass = getColor(percent)
            const isDefaulter = percent < 75 ? "Low" : ""
            row += `<td class="${colorClass}">${percent}% ${isDefaulter}</td>`
        })

        row += "</tr>"
        targetTable.innerHTML += row
    })
}

function loadStudents() {
    renderCieRows(cie1Table, "cie1")
    renderCieRows(cie2Table, "cie2")
}

async function loadHodStudentData() {
    const studentsData = await apiFetch(`/hod/students?${buildQuery({ program, sem, section, cie1Date, cie2Date })}`)

    classSubjects = studentsData.courses || []
    studentList = studentsData.students || []

    loadSubjectHeaders()
    loadStudents()
}

window.onload = async function () {
    try {
        const user = await requireAuth("hod")
        if (!user) return

        await initClassDetails()
        await loadHodStudentData()
    } catch (err) {
        console.error(err)
        const errorRow = `
            <tr>
                <td colspan="10" style="padding:20px;color:#ef4444;">
                    Error loading data: ${err.message}
                </td>
            </tr>
        `
        cie1Table.innerHTML = errorRow
        cie2Table.innerHTML = errorRow
    }
}

function applyCieDates(btn) {
    setBtnLoading(btn, "Applying...")
    cie1Date = document.getElementById("cie1Date").value
    cie2Date = document.getElementById("cie2Date").value
    localStorage.setItem(cieStorageKey(), JSON.stringify({ cie1Date, cie2Date }))
    setTimeout(() => window.location.reload(), 250)
}

function goBack(btn) {
    setBtnLoading(btn, "Going...")
    setTimeout(() => {
        window.location.href = "hod-dashboard.html"
    }, 300)
}

function exportClassReport(btn) {
    setBtnLoading(btn, "Exporting...")

    setTimeout(() => {
        if (studentList.length === 0) {
            showMessage("No data to export", "error")
            resetBtn(btn)
            return
        }

        let csv = "USN,Name,Parent Phone"

        classSubjects.forEach(sub => {
            csv += `,${sub.subject} CIE 1,${sub.subject} CIE 2,${sub.subject} Overall`
        })

        csv += "\n"

        studentList.forEach(student => {
            let row = `${student.usn},${student.name},${student.parentPhone || "-"}`

            classSubjects.forEach(sub => {
                row += `,${calculateCiePercentage(student.usn, sub.subject, "cie1")}%`
                row += `,${calculateCiePercentage(student.usn, sub.subject, "cie2")}%`
                row += `,${calculateCiePercentage(student.usn, sub.subject, "overall")}%`
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
        showMessage("Export successful", "success")
    }, 700)
}
