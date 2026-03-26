
/* -------- HOD Info -------- */

const hodName = localStorage.getItem("hodName")
const department = localStorage.getItem("hodDepartment")

document.getElementById("hodName").innerText = "Welcome " + hodName
document.getElementById("hodDept").innerText = "Department of " + department

/* -------- Container -------- */

const container = document.getElementById("courseCards")

/* -------- Get department courses -------- */

const deptCourses = courses.filter(
    course => course.department === department
)

/* -------- HOD Dashboard Stats -------- */

if (document.getElementById("totalCourses")) {

    document.getElementById("totalCourses").innerText = deptCourses.length

    /* Sections */

    const sectionSet = new Set()

    deptCourses.forEach(course => {
        sectionSet.add(`${course.department}_${course.program}_${course.sem}_${course.section}`)
    })

    document.getElementById("totalSections").innerText = sectionSet.size

    /* Students */

    let totalStudents = 0

    sectionSet.forEach(sec => {

        if (students[sec]) {
            totalStudents += students[sec].length
        }

    })

    document.getElementById("totalStudents").innerText = totalStudents

    /* Faculty */

    const facultySet = new Set()

    deptCourses.forEach(c => {
        facultySet.add(c.faculty)
    })

    document.getElementById("totalFaculty").innerText = facultySet.size

}

/* -------- Create class cards -------- */

const classMap = new Map()

deptCourses.forEach(course => {

    const key = `${course.department}_${course.program}_${course.sem}_${course.section}`

    if (!classMap.has(key)) {
        classMap.set(key, course)
    }

})

classMap.forEach(course => {

    let card = document.createElement("div")
    card.className = "card"

    card.innerHTML = `

<p><strong>Dept:</strong> ${course.department}</p>
<p><strong>Program:</strong> ${course.program}</p>
<p><strong>Semester:</strong> ${course.sem}</p>
<p><strong>Section:</strong> ${course.section}</p>

<button onclick="viewAttendance(
'${course.department}',
'${course.program}',
'${course.sem}',
'${course.section}'
)">View</button>

`

    container.appendChild(card)

})

/* -------- Open HOD Students Page -------- */

function viewAttendance(department, program, sem, section) {

    localStorage.setItem("department", department)
    localStorage.setItem("program", program)
    localStorage.setItem("sem", sem)
    localStorage.setItem("section", section)

    window.location.href = "hod-students.html"

}

/* -------- Calculate attendance percentage -------- */

function calculateSubjectPercentage(usn, subject, department, program, sem, section) {

    let present = 0
    let total = 0

    for (let i = 0; i < localStorage.length; i++) {

        let key = localStorage.key(i)

        if (key.startsWith(`${subject}_${department}_${program}_${sem}_${section}_`)) {

            let data = JSON.parse(localStorage.getItem(key) || "[]")

            let record = data.find(r => r.usn === usn)

            if (record) {

                total++

                if (record.status === "Present") {
                    present++
                }

            }

        }

    }

    if (total === 0) return "0%"

    return Math.round((present / total) * 100) + "%"

}
