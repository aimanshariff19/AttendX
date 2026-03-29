/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__LOGIN_RUNNING__) {
    throw new Error("Duplicate login JS blocked")
}
window.__LOGIN_RUNNING__ = true


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


/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Login Page Loaded")

    const btn = document.getElementById("loginBtn")
    if (btn) btn.addEventListener("click", studentLogin)
})


/* -------- LOGIN -------- */
function studentLogin() {

    const id = document.getElementById("studentId").value.trim()
    const pass = document.getElementById("password").value.trim()
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")

    if (!id || !pass) {
        error.innerText = "⚠ Enter ID & Password"
        return
    }

    if (typeof students === "undefined") {
        error.innerText = "❌ Data not loaded"
        return
    }

    const student = students.find(s => s.usn === id && s.password === pass)

    if (!student) {
        error.innerText = "❌ Invalid credentials"
        return
    }

    /* -------- SAVE -------- */
    localStorage.setItem("studentUSN", student.usn)
    localStorage.setItem("studentName", student.name)
    localStorage.setItem("studentClass", student.classKey)

    /* -------- LOADING -------- */
    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {
        window.location.href = "dashboard.html"
    }, 800)
}