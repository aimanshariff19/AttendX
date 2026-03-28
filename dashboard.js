/* -------- Faculty Welcome Panel -------- */

const facultyName = localStorage.getItem("facultyName")
const department = localStorage.getItem("department")

const faculty = localStorage.getItem("faculty") || facultyName

/* -------- Session Check -------- */

if (!faculty) {
    alert("Session expired. Please login again.")
    window.location.href = "html/index.html"
}

/* -------- Display Faculty Info -------- */

const facultyNameEl = document.getElementById("facultyName")
const facultyDeptEl = document.getElementById("facultyDept")
const facultyIdEl = document.getElementById("facultyId")

if (facultyNameEl) facultyNameEl.innerText = "Welcome " + facultyName
if (facultyDeptEl) facultyDeptEl.innerText = "Department of " + department
if (facultyIdEl) facultyIdEl.innerText = faculty

/* -------- Faculty Stats -------- */

const facultyCourses = courses.filter(course => course.faculty === faculty)

const courseCountEl = document.getElementById("courseCount")
if (courseCountEl) courseCountEl.innerText = facultyCourses.length

/* -------- Sections Teaching -------- */

const sections = [...new Set(
    facultyCourses.map(
        course => `${course.department}_${course.program}_${course.sem}_${course.section}`
    )
)]

const sectionCountEl = document.getElementById("sectionCount")
if (sectionCountEl) sectionCountEl.innerText = sections.length

/* -------- Total Students -------- */

let totalStudents = 0

sections.forEach(sec => {
    if (students[sec]) {
        totalStudents += students[sec].length
    }
})

const studentCountEl = document.getElementById("studentCount")
if (studentCountEl) studentCountEl.innerText = totalStudents

/* -------- Course Cards -------- */

const container = document.getElementById("courseCards")

if (container) {

    container.innerHTML = ""

    facultyCourses.forEach(course => {

        const today = new Date().toISOString().split("T")[0]

        const attendanceKey =
            `${course.subject}_${course.department}_${course.program}_${course.sem}_${course.section}_${today}`

        const takenToday = localStorage.getItem(attendanceKey)

        const card = document.createElement("div")

        card.className = takenToday ? "card completed" : "card"

        card.innerHTML = `

<p><strong>Course:</strong> ${course.subject}</p>
<p><strong>Dept:</strong> ${course.department}</p>
<p><strong>Program:</strong> ${course.program}</p>
<p><strong>Semester:</strong> ${course.sem}</p>
<p><strong>Section:</strong> ${course.section}</p>

${takenToday ? `<p style="color:#16a34a;font-weight:600">✔ Attendance taken today</p>` : ""}

`

        const btn = document.createElement("button")
        btn.innerText = "Take Attendance"

        btn.addEventListener("click", () => {

            takeAttendance(
                course.subject,
                course.department,
                course.program,
                course.sem,
                course.section
            )

        })

        card.appendChild(btn)
        container.appendChild(card)

    })

}

/* -------- Open Attendance Page -------- */

function takeAttendance(subject, department, program, sem, section, time) {

    localStorage.setItem("subject", subject)
    localStorage.setItem("department", department)
    localStorage.setItem("program", program)
    localStorage.setItem("sem", sem)
    localStorage.setItem("section", section)

    /* 🔥 FIX ADDED HERE */
    localStorage.setItem("prevPage", "dashboard.html")

    window.location.href = "attendance.html"
}

/* -------- Faculty Timetable -------- */

const today = new Date().toLocaleString('en-US', { weekday: 'long' })

const todayClasses = timetable.filter(
    t => t.faculty === faculty && t.day === today
)

const scheduleBox = document.getElementById("todaySchedule")

if (scheduleBox) {

    scheduleBox.innerHTML = ""

    if (todayClasses.length === 0) {

        scheduleBox.innerHTML = "<p>No classes scheduled today</p>"

    } else {

        todayClasses.forEach((cls, index) => {

            let status = "Upcoming"

            if (index === 0) status = "Next"

            let row = document.createElement("p")

            row.innerHTML = `
<strong>${cls.time}</strong> 
${cls.subject} | Sem ${cls.sem}${cls.section} 
<span style="color:#2563eb;font-weight:600">${status}</span>
`

            scheduleBox.appendChild(row)

        })

    }

}

/* -------- Class Reminder System -------- */

setInterval(() => {

    let now = new Date()

    let hour = now.getHours().toString().padStart(2, "0")
    let min = now.getMinutes().toString().padStart(2, "0")

    let current = hour + ":" + min

    todayClasses.forEach(cls => {

        if (current === cls.time) {

            if (typeof showMessage === "function") {

                showMessage(
                    `🔔 Class Reminder
${cls.subject}
Sem ${cls.sem}${cls.section}
Room ${cls.room}`,
                    "success"
                )

            }

        }

    })

}, 60000)