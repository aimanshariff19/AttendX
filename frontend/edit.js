/* -------- 🔥 FIX STUCK SPINNER -------- */
window.addEventListener("pageshow", function () {
    document.querySelectorAll(".loading").forEach(btn => {
        btn.classList.remove("loading")
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original
        }
    })
})

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text = "Loading") {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerHTML
    btn.classList.add("loading")
    btn.innerHTML = `${text} <span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    if (btn.dataset.original) {
        btn.innerHTML = btn.dataset.original
    }
}

/* -------- 🔥 SHAKE -------- */
function triggerShake(el) {
    if (!el) return
    el.classList.add("shake")
    setTimeout(() => el.classList.remove("shake"), 400)
}

/* -------- 🔥 ERROR -------- */
function showError(msg) {
    let box = document.getElementById("errorBox")

    if (!box) {
        box = document.createElement("div")
        box.id = "errorBox"
        box.style.position = "fixed"
        box.style.top = "20px"
        box.style.left = "50%"
        box.style.transform = "translateX(-50%)"
        box.style.background = "#ef4444"
        box.style.color = "white"
        box.style.padding = "10px 16px"
        box.style.borderRadius = "8px"
        box.style.fontSize = "13px"
        box.style.zIndex = "999"
        document.body.appendChild(box)
    }

    box.innerText = msg
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 2000)
}

/* -------- 🔥 CONTEXT -------- */
let subject = ''
let department = ''
let program = ''
let sem = ''
let section = ''
let studentList = []
let attendanceRecords = []

/* -------- UI -------- */
function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

setText("subject", subject)
setText("department", department)
setText("program", program)
setText("sem", sem)
setText("section", section)

/* -------- STUDENTS -------- */
let table = null

/* -------- 🔥 GET % -------- */
function getStudentStats(usn) {
    let total = 0
    let present = 0

    attendanceRecords.forEach(day => {
        const rec = day.records.find(r => r.studentId === usn)
        if (rec) {
            total += day.numClasses || 1
            if (rec.status === 'Present') present += day.numClasses || 1
        }
    })

    return total === 0 ? 100 : Math.round((present / total) * 100)
}

/* -------- 🔥 TOGGLE -------- */
function setRowStatus(row, isPresent) {
    const btn = row.querySelector(".status-btn")
    if (!btn) return

    btn.classList.remove("present", "absent", "active")

    if (isPresent) {
        btn.classList.add("present", "active")
        btn.innerText = "Present"
        row.style.background = "rgba(34,197,94,0.08)"
    } else {
        btn.classList.add("absent", "active")
        btn.innerText = "Absent"
        row.style.background = "rgba(239,68,68,0.12)"
    }

    const percentText = row.querySelector(".percent-text")
    const fill = row.querySelector(".fill")
    const percent = isPresent ? 100 : 0

    if (percentText) percentText.innerText = percent + "%"
    if (fill) fill.style.width = percent + "%"
}

function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

function findStudentRow(query, usedRows = new Set()) {
    const needle = normalize(query)
    if (!needle) return null

    return [...document.querySelectorAll("#studentRows tr")].find(row => {
        if (usedRows.has(row)) return false
        const usn = normalize(row.children[0]?.innerText)
        const name = normalize(row.children[1]?.innerText)
        return usn === needle || usn.endsWith(needle) || name.includes(needle)
    })
}

window.quickMark = function (isPresent) {
    const input = document.getElementById("quickSearch")
    const entries = (input?.value || "")
        .split(/[\s,;]+/)
        .map(value => value.trim())
        .filter(Boolean)

    if (entries.length === 0) {
        triggerShake(input)
        showError("Enter at least one student")
        return
    }

    const usedRows = new Set()
    const missing = []

    entries.forEach(entry => {
        const row = findStudentRow(entry, usedRows)
        if (!row) {
            missing.push(entry)
            return
        }

        usedRows.add(row)
        setRowStatus(row, isPresent)
    })

    const firstRow = [...usedRows][0]
    if (firstRow) {
        firstRow.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    if (missing.length > 0) {
        showError(`Not found: ${missing.join(", ")}`)
    } else {
        showError(`${usedRows.size} student(s) marked ${isPresent ? "present" : "absent"}`)
    }

    if (input) {
        input.value = ""
        input.focus()
    }
}

window.toggleStatus = function (btn) {
    const row = btn.closest("tr")
    setRowStatus(row, !btn.classList.contains("present"))
}

window.markAll = function (isPresent, event) {
    const btn = event?.target || document.activeElement
    setBtnLoading(btn, isPresent ? "Marking Present" : "Marking Absent")

    setTimeout(() => {
        document.querySelectorAll("#studentRows tr").forEach(row => {
            setRowStatus(row, isPresent)
        })

        resetBtn(btn)
    }, 250)
}

/* -------- 🔥 LOAD (NO BUTTON SPINNER) -------- */
window.loadAttendance = async function () {
    const dateInput = document.getElementById("attendanceDate")
    const timeDropdown = document.getElementById("timeSelect")
    const table = document.getElementById("studentRows")

    const date = dateInput?.value
    const time = timeDropdown?.value

    if (!date) {
        triggerShake(dateInput)
        showError("Select Date")
        return
    }

    if (!time) {
        triggerShake(timeDropdown)
        showError("Select Time Slot")
        return
    }

    table.innerHTML = `
        <tr>
            <td colspan="5" class="loader-row">
                <div class="spinner"></div>
                <p>Loading attendance...</p>
            </td>
        </tr>
    `

    try {
        const result = await apiFetch(`/faculty/attendance?${buildQuery({ subject, department, program, sem, section, date, time })}`)
        const entry = Array.isArray(result) ? result[0] : result

        table.innerHTML = ""

        if (!entry || !entry.records) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;padding:20px;">
                        ❌ No attendance found
                    </td>
                </tr>
            `
            return
        }

        studentList.forEach(student => {
            const rec = entry.records.find(r => r.studentId === (student.id || student.usn))
            const status = rec?.status || "Absent"
            const percent = getStudentStats(student.id || student.usn)
            const reason = rec?.reason || ""

            let row = document.createElement("tr")

            row.innerHTML = `
<td>${student.id || student.usn}</td>
<td>${student.name}</td>
<td>
<span class="percent-text">${percent}%</span>
<div class="bar">
<div class="fill" style="width:${percent}%"></div>
</div>
</td>
<td>
<button class="status-btn ${status === "Present" ? "present" : "absent"} active" onclick="toggleStatus(this)">
${status}
</button>
</td>
<td>
<input class="reason-input" value="${reason}" placeholder="Optional...">
</td>
`
            row.style.background = status === "Present" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.12)"
            table.appendChild(row)
        })
    } catch (err) {
        console.error(err)
        table.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:20px;color:#ef4444;">
                    ❌ Error loading attendance
                </td>
            </tr>
        `
    }
}

/* -------- 🔥 UPDATE -------- */
window.updateAttendance = async function (event) {
    const btn = event?.target
    const date = document.getElementById("attendanceDate").value
    const time = document.getElementById("timeSelect").value

    if (!date || !time) {
        showError("Select Date & Time")
        return
    }

    setBtnLoading(btn, "Updating")

    try {
        const rows = document.querySelectorAll("#studentRows tr")
        const records = {}

        rows.forEach(row => {
            const usn = row.children[0].innerText
            const statusBtn = row.querySelector(".status-btn")
            const reasonInput = row.querySelector(".reason-input")
            const status = statusBtn.classList.contains("present") ? "Present" : "Absent"
            records[usn] = { status, reason: reasonInput.value || '' }
        })

        await apiFetch('/faculty/attendance', {
            method: 'PUT',
            body: JSON.stringify({
                subject, department, program, sem, section, date, time, records
            })
        })

        resetBtn(btn)
        showError("✔ Attendance Updated")
    } catch (err) {
        console.error(err)
        showError(err.body?.msg || "Could not update attendance")
        resetBtn(btn)
    }
}

/* -------- 🔥 TIME DROPDOWN -------- */
async function populateTimeDropdown() {
    const dateInput = document.getElementById("attendanceDate")
    const timeDropdown = document.getElementById("timeSelect")

    const date = dateInput?.value
    if (!date) return

    try {
        const attendances = await apiFetch(`/faculty/attendance?${buildQuery({ subject, department, program, sem, section, date })}`)
        const rows = Array.isArray(attendances) ? attendances : []

        timeDropdown.innerHTML = `<option value="">Select Time Slot</option>`

        if (rows.length === 0) {
            timeDropdown.innerHTML = `<option value="">No records</option>`
            return
        }

        rows.forEach((a) => {
            const opt = document.createElement("option")
            opt.value = a.time_slot ?? a.time
            opt.innerText = resolveAttendanceSlotLabel(
                a.time_slot ?? a.time,
                a.numClasses
            )
            timeDropdown.appendChild(opt)
        })
    } catch (err) {
        console.error(err)
        timeDropdown.innerHTML = `<option value="">Error loading time slots</option>`
    }
}

document.getElementById("attendanceDate")?.addEventListener("change", populateTimeDropdown)

/* -------- INIT -------- */
window.onload = async function () {
    const params = getQueryParams()
    subject = params.subject || ''
    department = params.department || ''
    program = params.program || ''
    sem = params.sem || ''
    section = params.section || ''

    if (!subject || !department || !program || !sem || !section) {
        window.location.href = 'dashboard.html'
        return
    }

    setText("subject", subject)
    setText("department", department)
    setText("program", program)
    setText("sem", sem)
    setText("section", section)

    table = document.getElementById("studentRows")
    document.getElementById("quickSearch")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            quickMark(false)
        }
    })

    try {
        const [studentsData, attendanceData] = await Promise.all([
            apiFetch(`/faculty/students?${buildQuery({ department, program, sem, section })}`),
            apiFetch(`/faculty/attendance?${buildQuery({ subject, department, program, sem, section })}`)
        ])
        studentList = studentsData
        attendanceRecords = Array.isArray(attendanceData) ? attendanceData : []
    } catch (err) {
        console.error(err)
        showError("Unable to load class data")
    }
}

/* -------- 🔥 BACK -------- */
window.goBack = function (event) {

    const btn = event?.target

    if (btn.classList.contains("loading")) return

    setBtnLoading(btn, "Going")

    setTimeout(() => {
        window.history.back()
    }, 300)
}
