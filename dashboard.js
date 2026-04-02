/* -------- SAFE TEXT -------- */
function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerHTML = value || "-"
}

/* -------- USER -------- */
const faculty = localStorage.getItem("user")

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

/* -------- 🔥 BUTTON LOADING HELPER (FIXED) -------- */
function setBtnLoading(btn, textValue) {
    if (!btn) return

    btn.classList.add("loading")

    /* get or create text span */
    let text = btn.querySelector("span")
    if (text) {
        text.innerText = textValue
    } else {
        btn.innerHTML = `<span>${textValue}</span>`
    }

    /* remove old spinner if exists */
    let old = btn.querySelector(".btn-spinner")
    if (old) old.remove()

    /* create spinner */
    let spinner = document.createElement("span")
    spinner.className = "btn-spinner"

    btn.appendChild(spinner)
}

/* -------- FACULTY DETAILS -------- */
function loadFacultyDetails() {

    if (!faculty) return

    const info = facultyList.find(f => f.id === faculty)
    if (!info) return

    setText("facultyName", info.name)

    setText(
        "facultyDept",
        `<span style="opacity:0.8;">Department:</span> ${info.department}`
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
        box.innerHTML = "<p style='opacity:0.7;'>No classes today</p>"
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

        div.style.opacity = "0"
        div.style.transform = "translateY(10px)"

        setTimeout(() => {
            div.style.transition = "0.3s ease"
            div.style.opacity = "1"
            div.style.transform = "translateY(0)"
        }, index * 120)

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
        container.innerHTML = "<p style='opacity:0.7;'>No courses assigned</p>"
        return
    }

    unique.forEach((course, index) => {

        const card = document.createElement("div")
        card.className = "subject-card"

        card.innerHTML = `
            <h4>${course.subject}</h4>
            <p>${course.program} • Sem ${course.sem} • Sec ${course.section}</p>

            <button>
                <span>Take Attendance</span>
            </button>
        `

        /* 🔥 FIXED CLICK */
        card.querySelector("button").onclick = function () {
            setBtnLoading(this, "Opening...")
            openCourse(course.subject, course.program, course.sem, course.section)
        }

        card.style.opacity = "0"
        card.style.transform = "translateY(20px)"

        setTimeout(() => {
            card.style.transition = "0.4s ease"
            card.style.opacity = "1"
            card.style.transform = "translateY(0)"
        }, index * 120)

        container.appendChild(card)
    })
}

/* -------- OPEN COURSE -------- */
function openCourse(subject, program, sem, section) {

    document.querySelector(".dashboard").classList.add("page-exit")

    setTimeout(() => {

        localStorage.setItem("subject", subject)
        localStorage.setItem("program", program)
        localStorage.setItem("sem", sem)
        localStorage.setItem("section", section)

        window.location.href = "attendance.html"

    }, 400)
}

/* -------- LOGOUT -------- */
function logout(btn) {

    if (!btn) btn = document.querySelector(".logout-btn")

    setBtnLoading(btn, "Logging out...")

    setTimeout(() => {

        localStorage.clear()

        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "index.html"
        }, 400)

    }, 800)
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    if (!faculty) {
        document.body.innerHTML =
            "<h2 style='text-align:center;margin-top:50px;'>No faculty logged in ❌</h2>"
        return
    }

    setTimeout(() => {
        loadFacultyDetails()
        loadTodaySchedule()
        loadCourseCards()
    }, 300)
})