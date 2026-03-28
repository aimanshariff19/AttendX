/* -------- 💧 RIPPLE (FIXED - SINGLE) -------- */

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


/* -------- INIT -------- */

document.addEventListener("DOMContentLoaded", () => {

    const usn = localStorage.getItem("studentUSN")
    const classKey = localStorage.getItem("studentClass")

    if (!usn || !classKey) {
        window.location.href = "student-login.html"
        return
    }

    document.getElementById("studentUSN").innerText = usn

    const [department, program, sem, section] = classKey.split("_")

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section

    const table = document.getElementById("subjectRows")
    if (!table || typeof courses === "undefined") return

    /* -------- 🔥 FETCH SUBJECTS -------- */

    const rawSubjects = courses.filter(c =>
        c.department === department &&
        c.sem.toString() === sem &&
        c.section === section
    )

    const classSubjects = []
    rawSubjects.forEach(c => {
        if (!classSubjects.find(s => s.subject === c.subject)) {
            classSubjects.push(c)
        }
    })

    /* -------- CALCULATE -------- */

    function calculateAttendance(subject) {

        let present = 0
        let total = 0

        for (let i = 0; i < localStorage.length; i++) {

            let key = localStorage.key(i)

            if (key && key.startsWith(`${subject}_${department}_${program}_${sem}_${section}_`)) {

                let data = JSON.parse(localStorage.getItem(key) || "[]")

                let record = data.find(r => r.usn === usn)

                if (record) {
                    total++
                    if (record.status === "Present") present++
                }
            }
        }

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

    if (classSubjects.length === 0) {
        table.innerHTML = `<tr><td colspan="6">No subjects found ⚠️</td></tr>`
        return
    }

    classSubjects.forEach((sub, index) => {

        const stats = calculateAttendance(sub.subject)
        totalPercent += stats.percent

        const row = document.createElement("tr")

        row.style.animation = `fadeUp ${0.3 + index * 0.08}s ease`

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

    /* -------- 🔥 OVERALL ATTENDANCE -------- */

    const overall = Math.round(totalPercent / classSubjects.length)

    const overallBox = document.createElement("div")
    overallBox.className = "card"
    overallBox.style.marginBottom = "15px"

    overallBox.innerHTML = `
<p><strong>Overall Attendance:</strong> 
<span style="color:${getColor(overall)}">${overall}%</span></p>
<p id="warningText" style="font-weight:600;"></p>
`

    document.querySelector(".dashboard").insertBefore(
        overallBox,
        document.querySelector("table")
    )

    /* -------- ⚠ WARNING -------- */

    const warning = overallBox.querySelector("#warningText")

    if (overall < 75) {
        warning.innerText = "⚠ Low Attendance! Improve immediately"
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

    const btn = document.querySelector(".logout-btn")

    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        localStorage.removeItem("studentUSN")
        localStorage.removeItem("studentClass")
        localStorage.removeItem("studentName")

        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "student-login.html"
        }, 400)

    }, 700)
}


/* -------- CHANGE PASSWORD -------- */

function openChangePassword() {

    document.querySelector(".dashboard").classList.add("page-exit")

    setTimeout(() => {
        window.location.href = "change-password.html"
    }, 400)
}