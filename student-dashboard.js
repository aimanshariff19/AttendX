document.addEventListener("DOMContentLoaded", () => {

    /* -------- Session Check -------- */

    const usn = localStorage.getItem("studentUSN")
    const classKey = localStorage.getItem("studentClass")

    if (!usn || !classKey) {
        window.location.href = "student-login.html"
        return
    }

    /* -------- Display Student Info -------- */

    document.getElementById("studentUSN").innerText = usn


    /* -------- Class Details -------- */

    const [department, program, sem, section] = classKey.split("_")

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section


    /* -------- Subjects -------- */

    const table = document.getElementById("subjectRows")

    if (!table || typeof courses === "undefined") return

    const classSubjects = courses.filter(c =>
        c.department === department &&
        c.program === program &&
        c.sem.toString() === sem &&
        c.section === section
    )


    /* -------- Calculate Attendance -------- */

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


    /* -------- Load Subjects -------- */

    table.innerHTML = ""

    classSubjects.forEach(sub => {

        const stats = calculateAttendance(sub.subject)

        const row = document.createElement("tr")

        row.innerHTML = `
            <td>${sub.subject}</td>
            <td>${sub.subjectCode || "-"}</td>
            <td>${stats.conducted}</td>
            <td>${stats.present}</td>
            <td>${stats.absent}</td>
            <td>${stats.percent}%</td>
        `

        table.appendChild(row)
    })

})


/* -------- Logout -------- */

function studentLogout() {
    localStorage.removeItem("studentUSN")
    localStorage.removeItem("studentClass")
    localStorage.removeItem("studentName")

    window.location.href = "student-login.html"
}


/* -------- Change Password -------- */

function openChangePassword() {
    window.location.href = "change-password.html"
}