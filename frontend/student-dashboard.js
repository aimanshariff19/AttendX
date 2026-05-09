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
    btn.innerHTML = `<span>${text}</span><span class="btn-spinner"></span>`
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
        if (needed > 100) break // safety
    }
    return needed
}

function renderStats(stats) {
    const table = document.getElementById("subjectRows")
    if (!table) return

    table.innerHTML = ""
    let totalPercent = 0

    stats.forEach((sub, index) => {
        totalPercent += sub.percent
        
        const percentColor = sub.percent < 75 ? "#fb7185" : sub.percent < 85 ? "#fbbf24" : "#34d399"
        const percentBg = sub.percent < 75 ? "rgba(251,113,133,0.1)" : sub.percent < 85 ? "rgba(251,191,36,0.1)" : "rgba(52,211,153,0.1)"

        const row = document.createElement("tr")
        row.innerHTML = `
<td><strong style="color: #eef2ff;">${sub.subject}</strong></td>
<td><span style="opacity:0.6; font-family: monospace;">${sub.subjectCode || "-"}</span></td>
<td style="text-align:center;">${sub.conducted}</td>
<td style="text-align:center; color:#34d399;">${sub.present}</td>
<td style="text-align:center; color:#fb7185;">${sub.absent}</td>
<td>
    <div class="percent-chip" style="color:${percentColor}; background:${percentBg}; border:1px solid ${percentColor}33;">
        ${sub.percent}%
    </div>
    <div class="bar">
        <div class="fill" style="width:0%; background:${percentColor}; shadow: 0 0 10px ${percentColor}44;"></div>
    </div>
</td>
`

        row.style.opacity = "0"
        row.style.transform = "translateY(10px)"

        table.appendChild(row)

        // Animate in
        setTimeout(() => {
            row.style.transition = "0.4s ease-out"
            row.style.opacity = "1"
            row.style.transform = "translateY(0)"
            
            // Animate progress bar
            const fill = row.querySelector(".fill")
            setTimeout(() => {
                if (fill) fill.style.width = sub.percent + "%"
            }, 100)
        }, index * 60)
    })

    const overall = stats.length ? Math.round(totalPercent / stats.length) : 0
    const overallEl = document.getElementById("overallPercent")
    if (overallEl) {
        overallEl.innerText = overall + "%"
        overallEl.style.color = overall < 75 ? "#fb7185" : overall < 85 ? "#fbbf24" : "#34d399"
    }
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

    // Populate profile info
    document.getElementById("studentUSN").innerText = user.id
    document.getElementById("studentName").innerText = user.name
    document.getElementById("department").innerText = user.department || "N/A"
    
    // Populate stats grid
    document.getElementById("program").innerText = user.program || "N/A"
    document.getElementById("sem").innerText = user.sem || "N/A"
    document.getElementById("section").innerText = user.section || "N/A"

    document.getElementById("changePasswordBtn")?.addEventListener("click", function () {
        setBtnLoading(this, "Opening...")
        setTimeout(() => openChangePassword(), 300)
    })

    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        studentLogout()
    })

    try {
        const stats = await apiFetch('/student/stats')
        renderStats(stats)
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
