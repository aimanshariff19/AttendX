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

/* -------- BUTTON -------- */
function setBtnLoading(btn) {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerText
    btn.classList.add("loading")
    btn.innerText = ""
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    btn.innerText = btn.dataset.original
}

/* -------- CLASS DETAILS -------- */
const subject = localStorage.getItem("subject")
const department = localStorage.getItem("department")
const program = localStorage.getItem("program") || ""
const sem = localStorage.getItem("sem")
const section = localStorage.getItem("section")

const classKey = `${department}_${program}_${sem}_${section}`

const studentsList = students[classKey] || []

const dateDropdown = document.getElementById("attendanceDate")
const table = document.getElementById("studentRows")
const timeDropdown = document.getElementById("timeSelect")

/* -------- MESSAGE -------- */
function showMessage(text, type) {
    const box = document.getElementById("messageBox")
    if (!box) return

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => box.style.display = "none", 2500)
}

/* -------- LOAD TIMES (FIXED) -------- */
function loadTimesForDate() {

    const date = dateDropdown.value
    let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}

    const subjectData = db?.[classKey]?.[subject] || []

    let times = subjectData
        .filter(a => a.date === date)
        .map(a => a.time)

    times = [...new Set(times)]

    timeDropdown.innerHTML = ""

    if (times.length === 0) {
        timeDropdown.innerHTML = "<option>No classes</option>"
        return
    }

    timeDropdown.innerHTML = "<option>Select time</option>"

    times.forEach(time => {
        const option = document.createElement("option")
        option.value = time
        option.textContent = time
        timeDropdown.appendChild(option)
    })
}

/* -------- LOAD ATTENDANCE (FIXED) -------- */
function loadAttendance() {

    const btn = event?.target || document.activeElement
    setBtnLoading(btn)

    setTimeout(() => {

        const date = dateDropdown.value
        const time = timeDropdown.value

        let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}

        const subjectData = db?.[classKey]?.[subject] || []

        const entry = subjectData.find(a => a.date === date && a.time === time)

        if (!entry) {
            showMessage("Not found", "error")
            resetBtn(btn)
            return
        }

        table.innerHTML = ""

        studentsList.forEach(student => {

            const status = entry.records[student.usn] || "Absent"

            let row = document.createElement("tr")

            row.innerHTML = `
<td>${student.usn}</td>
<td>${student.name}</td>

<td>
<button class="status-btn ${status === "Present" ? "present" : "absent"} active"
onclick="toggleStatus(this)">
${status}
</button>
</td>
`

            table.appendChild(row)
        })

        resetBtn(btn)
        showMessage("Loaded ✅", "success")

    }, 500)
}

/* -------- TOGGLE -------- */
function toggleStatus(btn) {

    const isPresent = btn.classList.contains("present")

    btn.classList.remove("present", "absent")

    if (isPresent) {
        btn.classList.add("absent")
        btn.innerText = "Absent"
    } else {
        btn.classList.add("present")
        btn.innerText = "Present"
    }
}

/* -------- UPDATE (FIXED) -------- */
function updateAttendance() {

    const btn = document.querySelector(".update-btn")
    setBtnLoading(btn)

    setTimeout(() => {

        const date = dateDropdown.value
        const time = timeDropdown.value

        let db = JSON.parse(localStorage.getItem("attendanceDB")) || {}

        const subjectData = db?.[classKey]?.[subject] || []

        const entry = subjectData.find(a => a.date === date && a.time === time)

        if (!entry) {
            showMessage("Not found", "error")
            resetBtn(btn)
            return
        }

        let newRecords = {}

        document.querySelectorAll("#studentRows tr").forEach(row => {

            const usn = row.children[0].innerText
            const btn = row.querySelector(".status-btn")

            newRecords[usn] =
                btn.classList.contains("present") ? "Present" : "Absent"
        })

        entry.records = newRecords

        localStorage.setItem("attendanceDB", JSON.stringify(db))

        resetBtn(btn)
        showMessage("Updated ✅", "success")

        setTimeout(() => {
            window.location.href = "attendance.html"
        }, 500)

    }, 700)
}

/* -------- INIT -------- */
dateDropdown.addEventListener("change", loadTimesForDate)