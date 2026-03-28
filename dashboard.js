/* -------- SAFE TEXT -------- */

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerHTML = value || "-"
}


/* -------- USER -------- */

const faculty = localStorage.getItem("faculty")


/* -------- 💧 RIPPLE EFFECT -------- */

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


/* -------- FACULTY DETAILS -------- */

function loadFacultyDetails() {

    if (!faculty) return

    const info = facultyList.find(f => f.id === faculty)
    if (!info) return

    setText("facultyName", info.name)

    setText(
        "facultyDept",
        `<span style="font-weight:500;">Department:</span> ${info.department}`
    )

    setText("facultyId", info.id)

    const myCourses = courses.filter(c => c.faculty === faculty)

    setText("courseCount", myCourses.length)

    const sections = new Set(myCourses.map(c => c.section))
    setText("sectionCount", sections.size)

    let totalStudents = 0

    myCourses.forEach(c => {
        const key = `${c.department}_${c.program}_${c.sem}_${c.section}`
        if (students[key]) totalStudents += students[key].length
    })

    setText("studentCount", totalStudents)
}


/* -------- TODAY SCHEDULE -------- */

function loadTodaySchedule() {

    const box = document.getElementById("todaySchedule")
    if (!box) return

    const today = new Date().toLocaleString('en-US', { weekday: 'long' })

    const todayClasses = timetable.filter(t =>
        t.faculty === faculty &&
        t.day &&
        t.day.toLowerCase() === today.toLowerCase()
    )

    if (todayClasses.length === 0) {
        box.innerHTML = "<p>No classes today</p>"
        return
    }

    box.innerHTML = ""

    todayClasses.forEach((cls, index) => {

        const div = document.createElement("div")
        div.className = "tt-item"

        div.innerHTML = `
            <strong>${cls.subject}</strong><br>
            ${cls.program} • Sem ${cls.sem} • Sec ${cls.section} • Room ${cls.room}
        `

        div.style.animation = `fadeUp ${0.3 + index * 0.1}s ease`

        box.appendChild(div)
    })
}


/* -------- COURSE CARDS -------- */

function loadCourseCards() {

    const container = document.getElementById("courseCards")
    if (!container) return

    container.innerHTML = ""

    const myCourses = courses.filter(c => c.faculty === faculty)

    const unique = []

    myCourses.forEach(c => {

        const key = `${c.subject}_${c.program}_${c.sem}_${c.section}`

        if (!unique.find(u => u.key === key)) {
            unique.push({ ...c, key })
        }
    })

    if (unique.length === 0) {
        container.innerHTML = "<p>No courses assigned</p>"
        return
    }

    unique.forEach((course, index) => {

        const card = document.createElement("div")
        card.className = "card"

        card.innerHTML = `
            <p><strong>Subject:</strong> ${course.subject}</p>
            <p><strong>Branch:</strong> ${course.program}</p>
            <p><strong>Semester:</strong> ${course.sem}</p>
            <p><strong>Section:</strong> ${course.section}</p>

            <button onclick="openCourse('${course.subject}','${course.program}','${course.sem}','${course.section}')">
                Take Attendance
            </button>
        `

        card.style.animation = `fadeUp ${0.4 + index * 0.1}s ease`

        container.appendChild(card)
    })
}


/* -------- 🚀 OPEN COURSE -------- */

function openCourse(subject, program, sem, section) {

    // 🔥 PAGE EXIT
    document.querySelector(".dashboard").classList.add("page-exit")

    setTimeout(() => {

        localStorage.setItem("subject", subject)
        localStorage.setItem("program", program)
        localStorage.setItem("sem", sem)
        localStorage.setItem("section", section)

        window.location.href = "attendance.html"

    }, 400)
}


/* -------- 🚪 LOGOUT -------- */

function logout() {

    const btn = event.target

    // 🔥 LOADING EFFECT
    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        localStorage.removeItem("faculty")

        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "index.html"
        }, 400)

    }, 800)
}


/* -------- INIT -------- */

document.addEventListener("DOMContentLoaded", () => {

    if (!faculty) {
        document.body.innerHTML = "<h2 style='text-align:center;margin-top:50px;'>No faculty logged in ❌</h2>"
        return
    }

    loadFacultyDetails()
    loadTodaySchedule()
    loadCourseCards()
})