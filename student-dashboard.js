/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__DASHBOARD_RUNNING__) {
    throw new Error("Duplicate dashboard JS blocked")
}
window.__DASHBOARD_RUNNING__ = true


/* -------- 💧 RIPPLE -------- */
document.addEventListener("click", function (e) {
    const btn = e.target.closest("button")
    if (!btn) return

    if (btn.querySelector(".ripple")) return

    const circle = document.createElement("span")
    circle.classList.add("ripple")

    const rect = btn.getBoundingClientRect()
    circle.style.left = (e.clientX - rect.left) + "px"
    circle.style.top = (e.clientY - rect.top) + "px"

    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
})


/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Dashboard Loaded")

    const usn = localStorage.getItem("studentUSN")
    const name = localStorage.getItem("studentName")
    const classKey = localStorage.getItem("studentClass")

    if (!usn || !classKey) {
        window.location.href = "student-login.html"
        return
    }

    /* -------- DISPLAY BASIC -------- */
    document.getElementById("studentUSN").innerText = usn
    document.getElementById("studentName").innerText = name

    const [department, program, sem, section] = classKey.split("_")

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section

    const table = document.getElementById("subjectRows")

    if (!table || typeof courses === "undefined") {
        console.error("❌ Missing data")
        return
    }

    /* -------- SUBJECT FILTER -------- */
    const classSubjects = []

    courses.forEach(c => {
        if (
            c.department === department &&
            c.sem.toString() === sem &&
            c.section === section &&
            !classSubjects.find(s => s.subject === c.subject)
        ) {
            classSubjects.push(c)
        }
    })

    /* -------- LOAD STORAGE -------- */
    let attendanceData = {}

    try {
        attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || {}
    } catch {
        attendanceData = {}
    }

    /* -------- CALCULATE -------- */
    function calculateAttendance(subject) {

        const key = `${subject}_${department}_${program}_${sem}_${section}`
        const records = attendanceData[key] || []

        let present = 0
        let total = 0

        records.forEach(r => {
            if (r.usn === usn) {
                total++
                if (r.status === "Present") present++
            }
        })

        return total === 0 ? 0 : Math.round((present / total) * 100)
    }

    /* -------- LOAD TABLE -------- */
    table.innerHTML = ""

    let totalPercent = 0

    classSubjects.forEach(sub => {

        const percent = calculateAttendance(sub.subject)
        totalPercent += percent

        const row = document.createElement("tr")

        row.innerHTML = `
<td>${sub.subject}</td>
<td>${sub.subjectCode || "-"}</td>
<td colspan="3">--</td>
<td style="font-weight:600">${percent}%</td>
`

        table.appendChild(row)
    })

    /* -------- OVERALL -------- */
    const overall = classSubjects.length
        ? Math.round(totalPercent / classSubjects.length)
        : 0

    document.getElementById("overall").innerText = overall + "%"
})


/* -------- LOGOUT -------- */
function studentLogout() {
    localStorage.clear()
    window.location.href = "student-login.html"
}