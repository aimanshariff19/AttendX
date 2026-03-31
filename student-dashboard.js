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

    /* -------- DISPLAY -------- */
    document.getElementById("studentUSN").innerText = usn
    document.getElementById("studentName").innerText = name

    const [department, program, sem, section] = classKey.split("_")

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section

    /* -------- BUTTON EVENTS -------- */
    document.getElementById("changePasswordBtn")?.addEventListener("click", openChangePassword)
    document.getElementById("logoutBtn")?.addEventListener("click", studentLogout)

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

    /* -------- STORAGE -------- */
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

    /* -------- TABLE (UPGRADED UI) -------- */
    table.innerHTML = ""

    let totalPercent = 0

    classSubjects.forEach((sub, index) => {

        const stats = calculateAttendance(sub.subject)
        totalPercent += stats.percent

        const percentClass =
            stats.percent >= 85 ? "good" :
                stats.percent >= 75 ? "avg" : "low"

        const barClass = stats.percent < 75 ? "low-bar" : ""

        const row = document.createElement("tr")

        row.innerHTML = `
<td>${sub.subject}</td>
<td>${sub.subjectCode || "-"}</td>
<td>${stats.conducted}</td>
<td>${stats.present}</td>
<td>${stats.absent}</td>
<td class="${percentClass}">
    ${stats.percent}%
    <div class="bar ${barClass}">
        <div class="fill" style="width:${stats.percent}%"></div>
    </div>
</td>
`

        /* ✨ stagger animation */
        row.style.opacity = "0"
        row.style.transform = "translateY(10px)"

        setTimeout(() => {
            row.style.transition = "0.3s ease"
            row.style.opacity = "1"
            row.style.transform = "translateY(0)"
        }, index * 80)

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

<div class="bar ${overall < 75 ? "low-bar" : ""}">
    <div class="fill" style="width:${overall}%"></div>
</div>

<p id="warningText" style="margin-top:8px;font-weight:600;"></p>
`

    const warning = document.getElementById("warningText")

    if (overall < 75) {
        warning.innerText = "⚠ Low Attendance! Risk of shortage"
        warning.style.color = "#ef4444"
    } else if (overall < 85) {
        warning.innerText = "⚠ Average – Stay consistent"
        warning.style.color = "#f59e0b"
    } else {
        warning.innerText = "✅ Excellent Attendance"
        warning.style.color = "#22c55e"
    }

})


/* -------- NAV -------- */
function openChangePassword() {
    window.location.href = "change-password.html"
}


/* -------- LOGOUT (SMOOTH) -------- */
function studentLogout() {

    document.querySelector(".dashboard").style.opacity = "0"
    document.querySelector(".dashboard").style.transform = "scale(0.95)"

    setTimeout(() => {
        localStorage.clear()
        window.location.href = "student-login.html"
    }, 400)
}