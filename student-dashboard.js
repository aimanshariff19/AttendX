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

    document.getElementById("studentUSN").innerText = usn
    document.getElementById("studentName").innerText = name

    const [department, program, sem, section] = classKey.split("_")

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section

    const table = document.getElementById("subjectRows")
    if (!table || typeof courses === "undefined") return

    /* -------- SUBJECTS -------- */
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

    /* -------- 🔥 FAST STORAGE -------- */
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

        return {
            conducted: total,
            present,
            absent: total - present,
            percent: total === 0 ? 0 : Math.round((present / total) * 100)
        }
    }

    /* -------- COLOR -------- */
    function getColor(percent) {
        if (percent >= 85) return "#22c55e"
        if (percent >= 75) return "#f59e0b"
        return "#ef4444"
    }

    /* -------- LOAD TABLE -------- */
    table.innerHTML = ""

    let totalPercent = 0

    classSubjects.forEach((sub, index) => {

        const stats = calculateAttendance(sub.subject)
        totalPercent += stats.percent

        const row = document.createElement("tr")

        row.innerHTML = `
<td>${sub.subject}</td>
<td>${sub.subjectCode || "-"}</td>
<td>${stats.conducted}</td>
<td>${stats.present}</td>
<td>${stats.absent}</td>
<td style="font-weight:600;color:${getColor(stats.percent)}">
${stats.percent}%
</td>
`

        table.appendChild(row)
    })

    /* -------- OVERALL -------- */
    const overall = classSubjects.length
        ? Math.round(totalPercent / classSubjects.length)
        : 0

    let overallBox = document.getElementById("overallBox")

    if (!overallBox) {
        overallBox = document.createElement("div")
        overallBox.id = "overallBox"
        overallBox.className = "card"
        document.querySelector(".dashboard").prepend(overallBox)
    }

    overallBox.innerHTML = `
<p><strong>Overall Attendance:</strong> 
<span style="color:${getColor(overall)}">${overall}%</span></p>
<p id="warningText" style="font-weight:600;"></p>
`

    const warning = document.getElementById("warningText")

    if (overall < 75) {
        warning.innerText = "⚠ Low Attendance!"
        warning.style.color = "#dc2626"
    } else if (overall < 85) {
        warning.innerText = "⚠ Average Attendance"
        warning.style.color = "#f59e0b"
    } else {
        warning.innerText = "✅ Good Attendance"
        warning.style.color = "#16a34a"
    }

})


/* -------- LOGOUT -------- */
function studentLogout() {
    localStorage.clear()
    window.location.href = "student-login.html"
}