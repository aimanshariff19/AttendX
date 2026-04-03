/* -------- 🛑 STOP DUPLICATE -------- */
if (window.DASHBOARD_RUNNING) {
    throw new Error("Duplicate dashboard JS blocked")
}
window.DASHBOARD_RUNNING = true

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text = "Loading...") {
    if (!btn) return
if (!btn.dataset.original) {
    btn.dataset.original = btn.innerHTML
}

btn.classList.add("loading")
btn.innerHTML = `< span > ${ text }</span > `
}

function resetBtn(btn) {
    if (!btn) return

btn.classList.remove("loading")

if (btn.dataset.original) {
    btn.innerHTML = btn.dataset.original
}
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

/* -------- 🧠 PREDICTION -------- */
function predictAttendance(present, total, target = 75) {
    let needed = 0
    while (true) {
        let percent = ((present + needed) / (total + needed)) * 100
        if (percent >= target) return needed
        needed++
    }
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {


const usn = localStorage.getItem("studentUSN")
const name = localStorage.getItem("studentName")
const classKey = localStorage.getItem("studentClass")

if (!usn || !classKey) {
    window.location.href = "student-login.html"
    return
}

document.getElementById("studentUSN").innerText = usn
document.getElementById("studentName").innerText = name

const [department, program, sem, section] = classKey.split("_")

document.getElementById("department").innerText = department
document.getElementById("program").innerText = program
document.getElementById("sem").innerText = sem
document.getElementById("section").innerText = section

/* 🔥 BUTTON EVENTS */
document.getElementById("changePasswordBtn")?.addEventListener("click", function () {
    setBtnLoading(this, "Opening...")
    setTimeout(() => openChangePassword(), 300)
})

document.getElementById("logoutBtn")?.addEventListener("click", function () {
    setBtnLoading(this, "Logging out...")
    studentLogout()
})

const table = document.getElementById("subjectRows")
if (!table || typeof courses === "undefined") return

const classSubjects = []

courses.forEach(c => {
    if (
        c.department === department &&
        c.sem.toString() === sem &&
        c.section === section &&
        !classSubjects.find(s => s.subject === c.subject)
    ) {
        classSubjects.push(c)
    }
})

let attendanceData = {}

try {
    attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || {}
} catch {
    attendanceData = {}
}

function calculateAttendance(subject) {

    const key = `${ subject }_${ department }_${ program }_${ sem }_${ section } `
    const records = attendanceData[key] || []

    let present = 0
    let total = 0

    records.forEach(r => {
        if (r.usn === usn) {
            total++
            if (r.status === "Present") present++
        }
    })

    return {
        conducted: total,
        present,
        absent: total - present,
        percent: total === 0 ? 0 : Math.round((present / total) * 100)
    }
}

table.innerHTML = ""

let totalPercent = 0
classSubjects.forEach((sub, index) => {

    const stats = calculateAttendance(sub.subject)
    totalPercent += stats.percent

    const needed = predictAttendance(stats.present, stats.conducted)

    const row = document.createElement("tr")

    row.innerHTML = `
        <td>${sub.subject}</td>
<td>${sub.subjectCode || "-"}</td>
<td>${stats.conducted}</td>
<td>${stats.present}</td>
<td>${stats.absent}</td>

<td>
    <div class="circle ${stats.percent < 75 ? "low" : ""}"
        style="--percent:${stats.percent * 3.6}deg"
        data-text="${stats.percent}%">
    </div>


        < div class="bar ${stats.percent < 75 ? "low - bar" : ""}" >
            <div class="fill" style="width:${stats.percent}%"></div>
</div >

        <div style="font-size:11px;margin-top:6px;color:${stats.percent < 75 ? " #ef4444" : "#aaa"}" >
            ${ stats.percent < 75 ? `Need ${needed} more classes` : "On track" }
</div >

</td>
`

    row.style.opacity = "0"
    row.style.transform = "translateY(10px)"

    setTimeout(() => {
        row.style.transition = "0.3s ease"
        row.style.opacity = "1"
        row.style.transform = "translateY(0)"
    }, index * 80)

    table.appendChild(row)
})

/* -------- OVERALL -------- */
const overall = classSubjects.length
    ? Math.round(totalPercent / classSubjects.length)
    : 0

let overallBox = document.getElementById("overallBox")

if (!overallBox) {
    overallBox = document.createElement("div")
    overallBox.id = "overallBox"
    overallBox.className = "card"
    document.querySelector(".dashboard").prepend(overallBox)
}

overallBox.innerHTML = `
    

<p><strong>Overall Attendance:</strong>${overall}%</p>

<div class="bar ${overall < 75 ? "low-bar" : ""}">
    <div class="fill" style="width:${overall}%"></div>
</div>

<p style="margin-top:8px;font-weight:600;color:${overall < 75 ? "#ef4444" :
                overall < 85 ? "#f59e0b" :
                    "#22c55e"
            }">
    ${overall < 75 ? "⚠ Low Attendance" :
                overall < 85 ? "⚠ Average" :
                    "✅ Excellent"}
</p>
`
})

/* -------- NAV -------- */
function openChangePassword() {
    window.location.href = "change-password.html"
}

/* -------- LOGOUT -------- */
function studentLogout() {
    document.querySelector(".dashboard").style.opacity = "0"
    document.querySelector(".dashboard").style.transform = "scale(0.95)"

setTimeout(() => {
    localStorage.clear()
    window.location.href = "student-login.html"
}, 400)

}

/* -------- 🔥 FIX BACK BUTTON -------- */
window.addEventListener("pageshow", () => {
    document.querySelectorAll("button.loading").forEach(btn => {
        resetBtn(btn)
    })
})
