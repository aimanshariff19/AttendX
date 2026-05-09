/* -------- 🛑 STOP DUPLICATE -------- */
if (window.DASHBOARD_RUNNING) {
    throw new Error("Duplicate dashboard JS blocked")
}
window.DASHBOARD_RUNNING = true

let currentUser = null

/* -------- 🔥 BUTTON SPINNER -------- */
function setBtnLoading(btn, text = "Loading...") {
    if (!btn) return

    if (!btn.dataset.original) {
        btn.dataset.original = btn.innerHTML
    }

    btn.classList.add("loading")
    btn.innerHTML = `<span>${text}</span>`
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

function renderStats(stats) {
    const table = document.getElementById("subjectRows")
    if (!table) return

    table.innerHTML = ""
    let totalPercent = 0

    stats.forEach((sub, index) => {
        totalPercent += sub.percent
        const needed = predictAttendance(sub.present, sub.conducted)
        const percentColor = sub.percent < 75 ? "#ef4444" : sub.percent < 85 ? "#f59e0b" : "#22c55e"
        const percentBg = sub.percent < 75 ? "rgba(239,68,68,0.12)" : sub.percent < 85 ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)"

        const row = document.createElement("tr")
        row.innerHTML = `
<td>${sub.subject}</td>
<td>${sub.subjectCode || "-"}</td>
<td>${sub.conducted}</td>
<td>${sub.present}</td>
<td>${sub.absent}</td>
<td>
    <div class="circle ${sub.percent < 75 ? "low" : ""}"
        style="--percent:${sub.percent * 3.6}deg"
        data-text="${sub.percent}%">
    </div>
    <div class="bar ${sub.percent < 75 ? "low-bar" : ""}">
        <div class="fill" style="width:${sub.percent}%"></div>
    </div>
    <div style="font-size:13px;margin-top:8px;color:${percentColor};background:${percentBg};border:1px solid ${percentColor};border-radius:999px;padding:4px 8px;display:inline-block;font-weight:700;">
        ${sub.percent}%
    </div>
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

    const overall = stats.length ? Math.round(totalPercent / stats.length) : 0
    let overallBox = document.getElementById("overallBox")

    if (!overallBox) {
        overallBox = document.createElement("div")
        overallBox.id = "overallBox"
        overallBox.className = "card"
        document.querySelector(".dashboard").prepend(overallBox)
    }

    overallBox.innerHTML = `
<p><strong>Overall Attendance:</strong> ${overall}%</p>
<div class="bar ${overall < 75 ? "low-bar" : ""}">
    <div class="fill" style="width:${overall}%"></div>
</div>
<p style="margin-top:8px;font-weight:600;color:${overall < 75 ? "#ef4444" : overall < 85 ? "#f59e0b" : "#22c55e"}">
    ${overall < 75 ? "⚠ Low Attendance" : overall < 85 ? "⚠ Average" : "✅ Excellent"}
</p>
`
}

function renderNotifications(notifications) {
    let box = document.getElementById("notificationBox")

    if (!box) {
        box = document.createElement("div")
        box.id = "notificationBox"
        box.className = "card"
        const profileCard = document.querySelector(".card")
        profileCard?.insertAdjacentElement("afterend", box)
    }

    const unread = (notifications || []).slice(0, 5)

    if (unread.length === 0) {
        box.innerHTML = "<p><strong>Alerts:</strong> No new alerts</p>"
        return
    }

    box.innerHTML = `
<p><strong>Alerts</strong></p>
${unread.map(n => `
    <p style="grid-column:1/-1;color:${n.type === "critical" ? "#ef4444" : "#f59e0b"}">
        ${n.message}
    </p>
`).join("")}
`
}

function openChangePassword() {
    window.location.href = "change-password.html"
}

async function studentLogout() {
    const btn = document.getElementById("logoutBtn")
    setBtnLoading(btn, "Logging out...")
    try {
        await logoutBackend()
    } catch (err) {
        console.error(err)
    }
    window.location.href = "student-login.html"
}

async function loadStudentDashboard() {
    const user = await requireAuth('student')
    if (!user) return
    currentUser = user

    document.getElementById("studentUSN").innerText = user.id
    document.getElementById("studentName").innerText = user.name
    document.getElementById("department").innerText = user.department || "-"
    document.getElementById("program").innerText = user.program || "-"
    document.getElementById("sem").innerText = user.sem || "-"
    document.getElementById("section").innerText = user.section || "-"

    document.getElementById("changePasswordBtn")?.addEventListener("click", function () {
        setBtnLoading(this, "Opening...")
        setTimeout(() => openChangePassword(), 300)
    })

    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        setBtnLoading(this, "Logging out...")
        studentLogout()
    })

    try {
        const stats = await apiFetch('/student/stats')
        renderStats(stats)
    } catch (err) {
        console.error(err)
    }

    try {
        const notifications = await apiFetch('/student/notifications')
        renderNotifications(notifications)
    } catch (err) {
        console.error(err)
    }
}

window.addEventListener("DOMContentLoaded", loadStudentDashboard)

window.addEventListener("pageshow", () => {
    document.querySelectorAll("button.loading").forEach(btn => {
        btn.classList.remove("loading")
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original
        }
    })
})
