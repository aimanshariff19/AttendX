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

/* -------- 👁 TOGGLE PASSWORD -------- */
const eyeIcon = document.getElementById("eyeIcon")
const passwordInput = document.getElementById("password")

if (eyeIcon && passwordInput) {
    eyeIcon.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text"
            eyeIcon.classList.remove("fa-eye")
            eyeIcon.classList.add("fa-eye-slash")
        } else {
            passwordInput.type = "password"
            eyeIcon.classList.remove("fa-eye-slash")
            eyeIcon.classList.add("fa-eye")
        }
    })
}

/* -------- 🎓 LOGIN FUNCTION -------- */
function studentLogin() {

    const usn = document.getElementById("studentId").value.trim()
    const password = document.getElementById("password").value.trim()
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")

    error.innerText = ""

    if (!usn || !password) {
        error.innerText = "⚠ Enter all fields"
        shakeInputs()
        return
    }

    // 🔥 Find student from mockData
    let foundStudent = null
    let classKey = null

    for (let key in students) {
        const student = students[key].find(s => s.usn === usn && s.password === password)
        if (student) {
            foundStudent = student
            classKey = key
            break
        }
    }

    if (!foundStudent) {
        error.innerText = "❌ Invalid USN or Password"
        shakeInputs()
        return
    }

    // ✅ Save session
    localStorage.setItem("studentUSN", foundStudent.usn)
    localStorage.setItem("studentName", foundStudent.name)
    localStorage.setItem("studentClass", classKey)

    // 🌀 loading animation
    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        document.body.classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "student-dashboard.html"
        }, 400)

    }, 700)
}

/* -------- ⚡ SHAKE EFFECT -------- */
function shakeInputs() {

    const inputs = document.querySelectorAll("input")

    inputs.forEach(input => {
        input.classList.add("input-error")
    })

    const container = document.querySelector(".login-container")
    container.style.animation = "shake 0.3s"

    setTimeout(() => {
        container.style.animation = ""
        inputs.forEach(input => input.classList.remove("input-error"))
    }, 300)
}