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

/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

/* -------- UNIVERSAL GET -------- */
function getAttendanceRecords(key) {
    let stored = JSON.parse(localStorage.getItem(key) || "{}")
    return stored.data || []
}

/* -------- HOD INFO -------- */
const hodName = localStorage.getItem("hodName")
const department = localStorage.getItem("hodDepartment")

document.getElementById("hodName").innerText = "Welcome " + (hodName || "")
document.getElementById("hodDept").innerText = "Department of " + (department || "")

/* -------- CONTAINER -------- */
const container = document.getElementById("courseCards")

/* -------- GET COURSES -------- */
const deptCourses = courses.filter(
    course => course.department === department
)

/* -------- STATS -------- */
if (document.getElementById("totalCourses")) {

    document.getElementById("totalCourses").innerText = deptCourses.length

    const sectionSet = new Set()

    deptCourses.forEach(course => {
        sectionSet.add(`${course.department}_${course.program}_${course.sem}_${course.section}`)
    })

    document.getElementById("totalSections").innerText = sectionSet.size

    let totalStudents = 0

    sectionSet.forEach(sec => {
        if (students[sec]) totalStudents += students[sec].length
    })

    document.getElementById("totalStudents").innerText = totalStudents

    const facultySet = new Set()

    deptCourses.forEach(c => facultySet.add(c.faculty))

    document.getElementById("totalFaculty").innerText = facultySet.size
}

/* -------- CREATE CARDS -------- */
const classMap = new Map()

deptCourses.forEach(course => {

    const key = `${course.department}_${course.program}_${course.sem}_${course.section}`

    if (!classMap.has(key)) {
        classMap.set(key, course)
    }

})

let index = 0

classMap.forEach(course => {

    let card = document.createElement("div")
    card.className = "card"

    card.style.animation = `fadeUp ${0.3 + index * 0.1}s ease`
    index++

    card.innerHTML = `
<p><strong>Dept:</strong> ${course.department}</p>
<p><strong>Program:</strong> ${course.program}</p>
<p><strong>Semester:</strong> ${course.sem}</p>
<p><strong>Section:</strong> ${course.section}</p>

<button onclick="viewAttendance(
'${course.department}',
'${course.program}',
'${course.sem}',
'${course.section}',
this
)">View</button>
`

    container.appendChild(card)

})

/* -------- VIEW -------- */
function viewAttendance(department, program, sem, section, btn) {

    if (btn) {
        btn.classList.add("loading")
        btn.innerText = ""
    }

    setTimeout(() => {

        localStorage.setItem("department", department)
        localStorage.setItem("program", program)
        localStorage.setItem("sem", sem)
        localStorage.setItem("section", section)

        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "hod-students.html"
        }, 400)

    }, 600)
}

/* -------- LOGOUT -------- */
function logout() {

    const btn = event.target

    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        localStorage.removeItem("hodName")
        localStorage.removeItem("hodDepartment")

        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "index.html"
        }, 400)

    }, 700)
}

/* -------- ✅ FIXED CALCULATE -------- */
function calculateSubjectPercentage(usn, subject, department, program, sem, section) {

    let present = 0
    let total = 0

    const base = `${normalize(subject)}_${normalize(department)}_${normalize(program)}_${sem}_${normalize(section)}`

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key && key.toLowerCase().startsWith(base)) {

            let records = getAttendanceRecords(key)
            let record = records.find(r => r.usn === usn)

            if (record) {
                total++
                if (record.status === "Present") present++
            }
        }
    }

    if (total === 0) return "0%"

    return Math.round((present / total) * 100) + "%"
}