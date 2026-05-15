/* -------- 🔥 FIX STUCK SPINNER (BFCACHE) -------- */
window.addEventListener("pageshow", function () {
    document.querySelectorAll(".loading").forEach(btn => {
        btn.classList.remove("loading")
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original
        }
    })
})

/* -------- 🔥 NORMALIZE -------- */
function normalize(str) {
    return (str || "").toString().toLowerCase().replace(/\s+/g, "")
}

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

/* -------- 🔥 SHAKE FUNCTION -------- */
function triggerShake(el) {
    if (!el) return
    el.classList.add("shake")
    setTimeout(() => el.classList.remove("shake"), 400)
}

/* -------- 🔥 ERROR MESSAGE -------- */
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

/* -------- 🔥 CURRENT TIME -------- */
function updateCurrentTime() {
    const now = new Date()
    let h = now.getHours()
    const m = String(now.getMinutes()).padStart(2, "0")
    const ampm = h >= 12 ? "PM" : "AM"
    h = h % 12
    h = h ? h : 12

    const el = document.getElementById("currentTime")
    if (el) el.value = `${h}:${m} ${ampm}`
}

/* -------- 🔥 CONVERT 12 → 24 -------- */
function convertTo24Hour(time12) {
    if (!time12) return ""
    if (!time12.includes("AM") && !time12.includes("PM")) return time12

    const [time, modifier] = time12.split(" ")
    let [hours, minutes] = time.split(":").map(Number)

    if (modifier === "PM" && hours !== 12) hours += 12
    if (modifier === "AM" && hours === 12) hours = 0

    return `${String(hours).padStart(2, "0")}:${minutes}`
}

/* Stored slot shown in UI and saved to DB ("9:00 AM - 11:00 AM"). Local copy so submit does not rely on utils.js cache/load order. */
function formatAttendanceSlotStored(startHHMM, numClasses) {
    const n = parseInt(numClasses, 10)
    const hours = Number.isFinite(n) && n > 0 ? n : 1
    if (!startHHMM || typeof startHHMM !== "string") return ""
    const clock = startHHMM.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/)
    if (!clock) return ""
    const h = parseInt(clock[1], 10)
    const m = parseInt(clock[2], 10)
    if (Number.isNaN(h) || Number.isNaN(m)) return ""

    const startDate = new Date()
    startDate.setHours(h, m, 0, 0)
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + hours * 60)

    const fmt = (d) => {
        let hr = d.getHours()
        const min = String(d.getMinutes()).padStart(2, "0")
        const ampm = hr >= 12 ? "PM" : "AM"
        hr = hr % 12
        hr = hr ? hr : 12
        return `${hr}:${min} ${ampm}`
    }
    return `${fmt(startDate)} - ${fmt(endDate)}`
}

/* -------- 🔥 TIME RANGE -------- */
function calculateTimeRange() {
    const start = document.getElementById("classTime")?.value
    const num = parseInt(document.getElementById("numClasses")?.value)

    const el = document.getElementById("timeRange")
    if (!el) return

    if (!start || !num) {
        el.innerText = "--"
        return
    }

    el.innerText = formatAttendanceSlotStored(start, num)
}

/* -------- CLASS DETAILS -------- */
let subject = ''
let department = ''
let program = ''
let sem = ''
let section = ''
let studentList = []
let attendanceRecords = []
let table = null
let faceStream = null

function setFaceStatus(message) {
    const el = document.getElementById("faceStatus")
    if (el) el.innerText = message
}

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

function normalizeCourseSubject(value) {
    const subjectValue = String(value || '').trim()
    const aliases = {
        DS: 'Data Structures',
        DBMS: 'Database Systems'
    }
    return aliases[subjectValue.toUpperCase()] || subjectValue
}

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

/* -------- LOAD STUDENTS -------- */
function loadStudents() {
    if (!table) return
    table.innerHTML = ""

    if (studentList.length === 0) {
        table.innerHTML = `<tr><td colspan="4">No students</td></tr>`
        return
    }

    studentList.forEach((student) => {
        const percent = getStudentStats(student.id || student.usn)
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
    <button class="status-btn absent active" onclick="toggleStatus(this)">
        Absent
    </button>
</td>
`
        row.style.background = "rgba(239,68,68,0.12)"
        table.appendChild(row)
    })
}

/* -------- 🔥 TOGGLE -------- */
function toggleStatus(btn) {
    const row = btn.closest("tr")
    const percentText = row.querySelector(".percent-text")
    const fill = row.querySelector(".fill")
    const isPresent = btn.classList.contains("present")

    btn.classList.remove("present", "absent", "active")

    if (isPresent) {
        btn.classList.add("absent", "active")
        btn.innerText = "Absent"
        row.style.background = "rgba(239,68,68,0.08)"
    } else {
        btn.classList.add("present", "active")
        btn.innerText = "Present"
        row.style.background = "rgba(34,197,94,0.08)"
    }

    const percent = btn.classList.contains("present") ? 100 : 0
    if (percentText) percentText.innerText = percent + "%"
    if (fill) fill.style.width = percent + "%"
}

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

function quickMark(isPresent) {
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

async function startFaceDevice(btn) {
    const video = document.getElementById("faceVideo")
    if (!video) return

    try {
        setBtnLoading(btn, "Starting")
        if (!faceStream) {
            faceStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            })
        }
        video.srcObject = faceStream
        await video.play()
        setFaceStatus("Camera started. Scan students enrolled by admin.")
    } catch (err) {
        console.error(err)
        setFaceStatus("Camera permission is required for face recognition.")
        showError("Allow camera access")
    } finally {
        resetBtn(btn)
    }
}

function captureFaceSignature() {
    const video = document.getElementById("faceVideo")
    if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error("Start the camera first")
    }

    const canvas = document.createElement("canvas")
    const size = 16
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0, size, size)
    const data = ctx.getImageData(0, 0, size, size).data
    const gray = []

    for (let i = 0; i < data.length; i += 4) {
        gray.push(Math.round((data[i] + data[i + 1] + data[i + 2]) / 3))
    }

    const average = gray.reduce((sum, value) => sum + value, 0) / gray.length
    return gray.map(value => (value >= average ? "1" : "0")).join("")
}

function signatureDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY
    let diff = 0
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) diff++
    }
    return diff
}

async function getFaceRegistry() {
    return await apiFetch(`/faculty/face-registry?${buildQuery({ department, program, sem, section })}`)
}

function validateFaceAttendanceSlot() {
    const date = document.getElementById("date")?.value
    const timeInput = document.getElementById("classTime")?.value
    const numClassesVal = parseInt(document.getElementById("numClasses")?.value) || 1
    const time = formatAttendanceSlotStored(timeInput, numClassesVal)

    if (!date) {
        triggerShake(document.getElementById("date"))
        throw new Error("Select Date")
    }
    if (!time) {
        triggerShake(document.getElementById("classTime"))
        throw new Error("Select Time Slot")
    }

    return { date, time, numClassesVal }
}

async function scanFaceAttendance(btn) {
    try {
        setBtnLoading(btn, "Scanning")
        if (!faceStream) await startFaceDevice()

        const registry = await getFaceRegistry()
        const enrolled = Object.entries(registry)
        if (enrolled.length === 0) {
            showError("Enroll faces first")
            setFaceStatus("No admin-enrolled faces found for this class.")
            return
        }

        const current = captureFaceSignature()
        let best = { studentId: "", distance: Number.POSITIVE_INFINITY }
        enrolled.forEach(([studentId, data]) => {
            const distance = signatureDistance(current, data.signature)
            if (distance < best.distance) best = { studentId, distance }
        })

        if (!best.studentId || best.distance > 88) {
            showError("Face not recognized")
            setFaceStatus("Face not recognized. Try better lighting or enroll again.")
            return
        }

        const { date, time, numClassesVal } = validateFaceAttendanceSlot()
        const result = await apiFetch('/faculty/face-scan-attendance', {
            method: 'POST',
            body: JSON.stringify({
                subject,
                department,
                program,
                sem,
                section,
                date,
                time,
                numClasses: numClassesVal,
                studentId: best.studentId
            })
        })

        const row = findStudentRow(best.studentId)
        if (row) setRowStatus(row, true)

        const name = result?.student?.name || best.studentId
        setFaceStatus(`${name} recognized and marked Present for ${time}.`)
        showError(`${name} marked present`)
    } catch (err) {
        console.error(err)
        showError(err.body?.msg || err.message || "Could not scan attendance")
        setFaceStatus(err.body?.msg || err.message || "Scan failed.")
    } finally {
        resetBtn(btn)
    }
}

/* -------- 🔥 UPDATED SUBMIT -------- */
async function submitAttendance(btn) {
    if (!btn) btn = document.getElementById("submitBtn")

    const date = document.getElementById("date")?.value
    const timeInput = document.getElementById("classTime")?.value
    const numClassesVal = parseInt(document.getElementById("numClasses")?.value) || 1

    if (!date) {
        triggerShake(document.getElementById("date"))
        showError("Select Date")
        return
    }

    if (!timeInput) {
        triggerShake(document.getElementById("classTime"))
        showError("Select Time Slot")
        return
    }

    const time = formatAttendanceSlotStored(timeInput, numClassesVal)
    if (!time) {
        triggerShake(document.getElementById("classTime"))
        showError("Invalid start time")
        return
    }

    setBtnLoading(btn, "Submitting")

    setTimeout(async () => {
        const rows = document.querySelectorAll("#studentRows tr")
        const records = {}

        rows.forEach(row => {
            const usn = row.children[0].innerText
            const b = row.querySelector(".status-btn")
            const status = b.classList.contains("present") ? "Present" : "Absent"
            records[usn] = { status }
        })

        try {
            await apiFetch('/faculty/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    subject,
                    department,
                    program,
                    sem,
                    section,
                    date,
                    time,
                    numClasses: numClassesVal,
                    records
                })
            })
            window.location.href = "attendance.html?" + buildQuery({ subject, department, program, sem, section })
        } catch (err) {
            console.error(err)
            showError(err.body?.msg || err.message || "Could not submit attendance")
            resetBtn(btn)
        }
    }, 800)
}

/* -------- 🔥 EDIT -------- */
function editAttendance(btn) {
    if (btn && btn.target) btn = btn.target
    setBtnLoading(btn, "Opening")
    setTimeout(() => {
        window.location.href = "edit-attendance.html?" + buildQuery({ subject, department, program, sem, section })
    }, 400)
}

/* -------- 🔥 BACK -------- */
function goBack(btn) {
    if (btn && btn.target) btn = btn.target

    document.querySelectorAll(".loading").forEach(b => {
        if (b !== btn) resetBtn(b)
    })

    setBtnLoading(btn, "Going")

    setTimeout(() => {
        window.history.back()
    }, 250)
}

/* -------- 🔥 BULK -------- */
function markAll(isPresent, event) {

    let btn = event?.target || document.activeElement

    setBtnLoading(btn, isPresent ? "Marking Present" : "Marking Absent")

    setTimeout(() => {

        document.querySelectorAll("#studentRows tr").forEach(row => {

            const b = row.querySelector(".status-btn")
            if (!b) return

            setRowStatus(row, isPresent)
        })

        resetBtn(btn)

    }, 400)
}

/* -------- INIT -------- */
window.onload = async function () {

    table = document.getElementById("studentRows")

    const dateInput = document.getElementById("date")
    const today = new Date().toISOString().split("T")[0]

    if (dateInput) {
        dateInput.value = today
        dateInput.setAttribute("readonly", true)
    }

    updateCurrentTime()
    setInterval(updateCurrentTime, 1000)

    document.getElementById("classTime")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("change", calculateTimeRange)
    document.getElementById("numClasses")?.addEventListener("input", calculateTimeRange)
    document.getElementById("quickSearch")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            quickMark(false)
        }
    })

    const params = getQueryParams()
    subject = normalizeCourseSubject(params.subject || '')
    department = params.department || ''
    program = params.program || ''
    sem = params.sem || ''
    section = params.section || params.sec || ''

    if (!subject || !department || !program || !sem || !section) {
        window.location.href = 'dashboard.html'
        return
    }

    setText("subject", subject)
    setText("department", department)
    setText("program", program)
    setText("sem", sem)
    setText("section", section)

    try {
        const [studentsData, attendanceData] = await Promise.all([
            apiFetch(`/faculty/students?${buildQuery({ department, program, sem, section })}`),
            apiFetch(`/faculty/attendance?${buildQuery({ subject, department, program, sem, section })}`)
        ])
        studentList = studentsData
        attendanceRecords = Array.isArray(attendanceData) ? attendanceData : []
    } catch (err) {
        console.error(err)
        showError("Unable to load class or attendance data")
        studentList = []
        attendanceRecords = []
    }

    loadStudents()
    calculateTimeRange()

}
