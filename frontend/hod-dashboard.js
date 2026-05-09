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

/* -------- BUTTON LOADING -------- */
function setBtnLoading(btn, textValue = "Loading...") {
    if (!btn) return

    btn.classList.add("loading")
    btn.innerHTML = `<span>${textValue}</span><span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    btn.innerHTML = "<span>Apply</span>"
}

/* -------- STATE -------- */
let hodUser = null
let allCourses = []
let allStudents = []

const departmentConfig = {
    CSE: {
        programs: {
            "CSE": ["A", "B", "C", "D"],
            "CSD": ["A", "B"]
        }
    },
    ISE: {
        programs: {
            "ISE": ["A", "B", "C", "D"],
            "CSDS": ["A", "B"]
        }
    },
    ME: {
        programs: {
            "ME": ["A", "B"]
        }
    },
    CIVIL: {
        programs: {
            "CIVIL": ["A", "B"]
        }
    },
    ECE: {
        programs: {
            "ECE": ["A", "B", "C"]
        }
    }
}

function optionList(values, placeholder) {
    return `<option value="">${placeholder}</option>` + values
        .map(value => `<option value="${value}">${value}</option>`)
        .join("")
}

/* -------- CONTAINER -------- */
const container = document.getElementById("courseCards")

/* -------- RENDER CARDS -------- */
function renderCards(courseList) {
    container.innerHTML = ""

    const classMap = new Map()

    courseList.forEach(course => {
        const key = `${course.department}_${course.program}_${course.sem}_${course.section}`
        if (!classMap.has(key)) classMap.set(key, course)
    })

    if (classMap.size === 0) {
        container.innerHTML = `<p style="opacity:0.6;">No classes found</p>`
        return
    }

    let index = 0

    classMap.forEach(course => {
        const classStudents = allStudents.filter(s =>
            s.department === course.department &&
            s.program === course.program &&
            String(s.sem) === String(course.sem) &&
            s.section === course.section
        ).length

        let card = document.createElement("div")
        card.className = "subject-card"

        card.innerHTML = `
            <h4>${course.program}</h4>
            <p>Sem ${course.sem} • Sec ${course.section}</p>
            <p>Students: ${classStudents}</p>

            <button>
                <span>View Details</span>
            </button>
        `

        const btn = card.querySelector("button")
        btn.onclick = function () {
            setBtnLoading(btn, "Opening...")
            setTimeout(() => {
                const params = buildQuery({
                    department: course.department,
                    program: course.program,
                    sem: course.sem,
                    section: course.section
                })
                window.location.href = `hod-students.html?${params}`
            }, 400)
        }

        /* animation */
        card.style.opacity = "0"
        card.style.transform = "translateY(20px)"

        setTimeout(() => {
            card.style.transition = "0.4s ease"
            card.style.opacity = "1"
            card.style.transform = "translateY(0)"
        }, index * 100)

        index++
        container.appendChild(card)
    })
}

/* -------- FILTERS -------- */
function populateFilters() {
    const deptSelect = document.getElementById("filterDept")
    const programSelect = document.getElementById("filterProgram")
    const semSelect = document.getElementById("filterSem")
    const sectionSelect = document.getElementById("filterSection")

    // 🔥 RESTRICTION: Only show HOD's own department in the dropdown
    const availableDepts = [hodUser.department]
    
    deptSelect.innerHTML = optionList(availableDepts, "Dept")
    deptSelect.value = hodUser.department
    deptSelect.disabled = true // Lock it to their department
    
    semSelect.innerHTML = optionList(["1", "2", "3", "4", "5", "6", "7", "8"], "Sem")

    refreshProgramFilter()

    deptSelect.onchange = () => {
        refreshProgramFilter()
        applyFilters()
    }
    programSelect.onchange = refreshSectionFilter
}

function refreshProgramFilter() {
    const dept = document.getElementById("filterDept").value || hodUser.department
    const programSelect = document.getElementById("filterProgram")
    const programs = Object.keys(departmentConfig[dept]?.programs || {})

    programSelect.innerHTML = optionList(programs, "Program")
    refreshSectionFilter()
}

function refreshSectionFilter() {
    const dept = document.getElementById("filterDept").value || hodUser.department
    const program = document.getElementById("filterProgram").value
    const sectionSelect = document.getElementById("filterSection")
    const programMap = departmentConfig[dept]?.programs || {}
    const sections = program ? programMap[program] || [] : [...new Set(Object.values(programMap).flat())]

    sectionSelect.innerHTML = optionList(sections, "Section")
}

/* -------- APPLY FILTER -------- */
function applyFilters(btn) {
    if (btn) setBtnLoading(btn, "Filtering...")

    const program = document.getElementById("filterProgram").value
    const sem = document.getElementById("filterSem").value
    const section = document.getElementById("filterSection").value
    const department = document.getElementById("filterDept").value

    const filtered = allCourses.filter(c =>
        (!department || c.department === department) &&
        (!program || c.program === program) &&
        (!sem || c.sem == sem) &&
        (!section || c.section === section)
    )

    setTimeout(() => {
        renderCards(filtered)
        if (btn) resetBtn(btn)
    }, 300)
}

/* -------- LOGOUT -------- */
async function logout(btn) {
    setBtnLoading(btn, "Logging out...")
    try {
        await logoutBackend()
        setTimeout(() => {
            window.location.href = "hod-login.html"
        }, 700)
    } catch (err) {
        console.error(err)
        resetBtn(btn)
    }
}

/* -------- INIT -------- */
async function initDashboard() {
    try {
        hodUser = await requireAuth('hod')
        if (!hodUser) return

        document.getElementById("hodName").innerText = "Welcome " + (hodUser.name || "")
        document.getElementById("hodDept").innerText = "Department of " + (hodUser.department || "")

        // Fetch courses and filter strictly by HOD's department
        const coursesData = await apiFetch(`/hod/courses`)
        allCourses = (coursesData || []).filter(c => c.department === hodUser.department)

        // Get unique class combinations for HOD's department
        const classSet = new Map()
        allCourses.forEach(course => {
            const key = `${course.department}_${course.program}_${course.sem}_${course.section}`
            if (!classSet.has(key)) {
                classSet.set(key, course)
            }
        })

        // Fetch students for each class
        const classArray = Array.from(classSet.values())
        for (const course of classArray) {
            try {
                const studentsData = await apiFetch(`/hod/students?${buildQuery({
                    department: course.department,
                    program: course.program,
                    sem: course.sem,
                    section: course.section
                })}`)
                if (studentsData.students) {
                    allStudents = allStudents.concat(studentsData.students)
                }
            } catch (err) {
                console.error(err)
            }
        }

        // Update stats based on filtered data
        document.getElementById("totalCourses").innerText = allCourses.length

        const sectionSet = new Set()
        allCourses.forEach(c => {
            sectionSet.add(`${c.department}_${c.program}_${c.sem}_${c.section}`)
        })
        document.getElementById("totalSections").innerText = sectionSet.size

        const studentSet = new Set()
        allStudents.forEach(s => {
            studentSet.add(s.usn || s.id)
        })
        document.getElementById("totalStudents").innerText = studentSet.size

        const facultySet = new Set()
        allCourses.forEach(c => facultySet.add(c.facultyId))
        document.getElementById("totalFaculty").innerText = facultySet.size

        populateFilters()
        renderCards(Array.from(classSet.values()))
    } catch (err) {
        console.error(err)
        container.innerHTML = `<p style="opacity:0.6;color:#ef4444;">Error loading dashboard: ${err.message}</p>`
    }
}

window.addEventListener("load", initDashboard)
