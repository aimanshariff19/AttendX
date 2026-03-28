/* -------- SAFE TEXT -------- */

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}


/* -------- GET LOGGED FACULTY -------- */

const faculty = localStorage.getItem("faculty")


/* -------- FACULTY DETAILS -------- */

function loadFacultyDetails() {

    if (!faculty) return

    setText("facultyName", faculty)
    setText("facultyDept", "Department: CSE")

    const myCourses = courses.filter(c => c.faculty === faculty)

    setText("facultyId", faculty)
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


/* -------- TODAY SCHEDULE (COMPACT, NO TIME) -------- */

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

        // 🔥 compact layout (no time)
        div.innerHTML = `
            <strong>${cls.subject}</strong><br>
            ${cls.program} • Sem ${cls.sem} • Sec ${cls.section} • Room ${cls.room}
        `

        box.appendChild(div)
    })
}


/* -------- COURSE CARDS (NO TIME) -------- */

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
            <p><strong>Subject:</strong> ${course.subject}</p>
            <p><strong>Branch:</strong> ${course.program}</p>
            <p><strong>Semester:</strong> ${course.sem}</p>
            <p><strong>Section:</strong> ${course.section}</p>

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