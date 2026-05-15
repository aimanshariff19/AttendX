/* -------- SAFE TEXT -------- */
function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerHTML = value || "-"
}

let currentUser = null
let facultyCourses = []
let facultyStudentCount = 0

function normalizeCourseSubject(value) {
    const subjectValue = String(value || '').trim()
    const aliases = {
        DS: 'Data Structures',
        DBMS: 'Database Systems'
    }
    return aliases[subjectValue.toUpperCase()] || subjectValue
}

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

/* -------- 🔥 BUTTON LOADING HELPER (FIXED) -------- */
function setBtnLoading(btn, textValue) {
    if (!btn) return

    if (!btn.dataset.original) {
        btn.dataset.original = btn.innerHTML
    }

    btn.classList.add("loading")

    let text = btn.querySelector("span")
    if (text) {
        text.innerText = textValue
    } else {
        btn.innerHTML = `<span>${textValue}</span>`
    }

    let old = btn.querySelector(".btn-spinner")
    if (old) old.remove()

    let spinner = document.createElement("span")
    spinner.className = "btn-spinner"

    btn.appendChild(spinner)
}

/* -------- FACULTY DETAILS -------- */
function loadFacultyDetails() {
    if (!currentUser) return

    setText("facultyName", currentUser.name)
    setText("facultyDept", `<span style="opacity:0.8;">Department:</span> ${currentUser.department}`)
    setText("facultyId", currentUser.id)

    const myCourses = facultyCourses
    setText("courseCount", myCourses.length)

    const sections = new Set(myCourses.map(c => `${c.department}_${c.program}_${c.sem}_${c.section}`))
    setText("sectionCount", sections.size)

    setText("studentCount", facultyStudentCount)
}

async function loadFacultyStudentCount() {
    const uniqueStudents = new Set()
    const uniqueClasses = new Map()

    facultyCourses.forEach(course => {
        const key = `${course.department}_${course.program}_${course.sem}_${course.section}`
        if (!uniqueClasses.has(key)) {
            uniqueClasses.set(key, course)
        }
    })

    for (const course of uniqueClasses.values()) {
        try {
            const students = await apiFetch(`/faculty/students?${buildQuery({
                department: course.department,
                program: course.program,
                sem: course.sem,
                section: course.section
            })}`)

            students.forEach(student => uniqueStudents.add(student.id || student.usn))
        } catch (err) {
            console.error(err)
        }
    }

    facultyStudentCount = uniqueStudents.size
}

/* -------- TODAY SCHEDULE -------- */
function loadTodaySchedule() {
    const box = document.getElementById("todaySchedule")
    if (!box) return

    if (typeof timetable === 'undefined' || !Array.isArray(timetable)) {
        box.innerHTML = "<p style='opacity:0.7;'>Schedule not available</p>"
        return
    }

    const today = new Date().toLocaleString('en-US', { weekday: 'long' })
    const todayClasses = timetable.filter(t =>
        t.faculty === currentUser?.id &&
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

    const unique = []
    facultyCourses.forEach(c => {
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

        card.querySelector("button").onclick = function () {
            openCourse(course.subject, course.department, course.program, course.sem, course.section, this)
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
function openCourse(subject, department, program, sem, section, btn) {
    if (section && typeof section === "object" && section.tagName) {
        btn = section
        section = sem
        sem = program
        program = department
    }

    if (btn) setBtnLoading(btn, "Opening...")

    document.querySelector(".dashboard").classList.add("page-exit")

    subject = normalizeCourseSubject(subject)
    const query = buildQuery({ subject, department, program, sem, section })
    setTimeout(() => {
        window.location.href = `attendance.html?${query}`
    }, 400)
}

/* -------- LOGOUT -------- */
async function logout(btn) {
    if (!btn) btn = document.querySelector(".logout-btn")
    setBtnLoading(btn, "Logging out...")

    try {
        await logoutBackend()
    } catch (err) {
        console.error(err)
    }

    document.querySelector(".dashboard").classList.add("page-exit")
    setTimeout(() => {
        window.location.href = "index.html"
    }, 400)
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", async () => {
    const user = await requireAuth('faculty')
    if (!user) return
    currentUser = user

    try {
        facultyCourses = await apiFetch('/faculty/courses')
        await loadFacultyStudentCount()
    } catch (err) {
        console.error(err)
        facultyCourses = []
        facultyStudentCount = 0
    }

    loadFacultyDetails()
    loadTodaySchedule()
    loadCourseCards()
})

/* 🔥 FIX STUCK SPINNER WHEN RETURNING FROM BACK */
window.addEventListener("pageshow", function () {
    document.querySelectorAll(".loading").forEach(btn => {
        btn.classList.remove("loading")
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original
        }
    })
})
