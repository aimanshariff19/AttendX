/* -------- 🛑 STOP DUPLICATE EXECUTION -------- */
if (window.__ATTENDX_RUNNING__) {
    console.warn("⚠️ Script already running. Stopping duplicate execution.")
    throw new Error("Duplicate JS execution blocked")
}
window.__ATTENDX_RUNNING__ = true


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
    const classKey = localStorage.getItem("studentClass")

    if (!usn || !classKey) {
        if (!window.location.pathname.includes("student-login.html")) {
            window.location.href = "student-login.html"
        }
        return
    }

    document.getElementById("studentUSN").innerText = usn

    const [department, program, sem, section] = classKey.split("_")

    document.getElementById("department").innerText = department
    document.getElementById("program").innerText = program
    document.getElementById("sem").innerText = sem
    document.getElementById("section").innerText = section

    const table = document.getElementById("subjectRows")

    if (!table || typeof courses === "undefined") {
        console.error("❌ Table or courses missing")
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
    } catch (e) {
        console.error("❌ Corrupted storage")
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
    const overall = classSubjects.length > 0
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

    const btn = document.querySelector(".logout-btn")
    if (!btn) return

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

    }, 600)
}


/* -------- CHANGE PASSWORD -------- */
function openChangePassword() {
    document.querySelector(".dashboard").classList.add("page-exit")
    setTimeout(() => {
        window.location.href = "change-password.html"
    }, 400)
}


/* -------- BACK -------- */
function goBack() {
    localStorage.removeItem("subject")
    window.history.back()
}


/* -------- GLOBAL LOGOUT -------- */
function logout() {

    localStorage.clear()
    window.location.href = "index.html"
}


/* -------- ROLE -------- */
function getUserRole() {
    if (localStorage.getItem("studentUSN")) return "student"
    if (localStorage.getItem("faculty")) return "faculty"
    if (localStorage.getItem("hodName")) return "hod"
    return "guest"
}

function studentLogin() {

    const id = document.getElementById("studentId").value.trim()
    const pass = document.getElementById("password").value.trim()
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")

    if (!id || !pass) {
        error.innerText = "⚠ Enter ID & Password"
        return
    }

    if (typeof students === "undefined") {
        error.innerText = "❌ Data not loaded"
        return
    }

    let foundStudent = null

    // 🔥 SEARCH IN ALL CLASSES
    for (let key in students) {
        const student = students[key].find(
            s => s.usn === id && s.password === pass
        )

        if (student) {
            foundStudent = student
            foundStudent.classKey = key
            break
        }
    }

    if (!foundStudent) {
        error.innerText = "❌ Invalid credentials"
        return
    }

    /* -------- SAVE -------- */
    localStorage.setItem("studentUSN", foundStudent.usn)
    localStorage.setItem("studentName", foundStudent.name)
    localStorage.setItem("studentClass", foundStudent.classKey)

    /* -------- LOADING -------- */
    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {
        window.location.href = "dashboard.html"
    }, 800)
}