/* -------- SAFE TEXT (HTML ENABLED) -------- */

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerHTML = value || "-"
}


/* -------- GET LOGGED FACULTY -------- */

const faculty = localStorage.getItem("faculty")


/* -------- FACULTY DETAILS -------- */

function loadFacultyDetails() {

    if (!faculty) return

    const info = facultyList.find(f => f.id === faculty)
    if (!info) return

    setText("welcomeText", `Welcome ${info.name}`)
    setText("facultyName", info.name)

    // 🔥 styled department
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

    todayClasses.forEach(cls => {

        const div = document.createElement("div")
        div.className = "tt-item"

        div.innerHTML = `
            <strong>${cls.subject}</strong><br>
            ${cls.program} • Sem ${cls.sem} • Sec ${cls.section} • Room ${cls.room}
        `

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

    unique.forEach(course => {

        const card = document.createElement("div")
        card.className = "card"

        card.innerHTML = `
            <p><span style="font-weight:600;">Subject:</span> ${course.subject}</p>
            <p><span style="font-weight:600;">Branch:</span> ${course.program}</p>
            <p><span style="font-weight:600;">Semester:</span> ${course.sem}</p>
            <p><span style="font-weight:600;">Section:</span> ${course.section}</p>

            <button onclick="openCourse('${course.subject}','${course.program}','${course.sem}','${course.section}')">
                Take Attendance
            </button>
        `

        container.appendChild(card)
    })
}


/* -------- OPEN COURSE -------- */

function openCourse(subject, program, sem, section) {

    localStorage.setItem("subject", subject)
    localStorage.setItem("program", program)
    localStorage.setItem("sem", sem)
    localStorage.setItem("section", section)

    window.location.href = "attendance.html"
}


/* -------- INIT -------- */

document.addEventListener("DOMContentLoaded", () => {

    if (!faculty) {
        alert("No faculty logged in ❌")
        return
    }

    loadFacultyDetails()
    loadTodaySchedule()
    loadCourseCards()
})