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

    const classSubjects = courses.filter(c =>
        c.department === department &&
        c.program === program &&
        c.sem.toString() === sem &&
        c.section === section
    )

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

    /* -------- COLOR LOGIC -------- */

    function getColor(percent) {
        if (percent >= 85) return "#22c55e"   // green
        if (percent >= 75) return "#f59e0b"   // orange
        return "#ef4444"                      // red
    }

    /* -------- LOAD TABLE -------- */

    table.innerHTML = ""

    classSubjects.forEach((sub, index) => {

        const stats = calculateAttendance(sub.subject)

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

})


/* -------- 🚪 LOGOUT -------- */

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


/* -------- 🔑 CHANGE PASSWORD -------- */

function openChangePassword() {

    document.querySelector(".dashboard").classList.add("page-exit")

    setTimeout(() => {
        window.location.href = "change-password.html"
    }, 400)
}