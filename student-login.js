/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__LOGIN_RUNNING__) {
    throw new Error("Duplicate login JS blocked")
}
window.__LOGIN_RUNNING__ = true


/* -------- RIPPLE EFFECT -------- */
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


/* -------- LOGIN FUNCTION -------- */
function studentLogin() {

    const idInput = document.getElementById("studentId")
    const passInput = document.getElementById("password")
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")
    const card = document.querySelector(".login-container")

    const id = idInput.value.trim()
    const pass = passInput.value.trim()

    error.innerText = ""

    /* EMPTY */
    if (!id || !pass) {
        error.innerText = "⚠ Enter ID & Password"
        shake()
        return
    }

    /* DATA CHECK */
    if (typeof students === "undefined") {
        error.innerText = "❌ Data not loaded"
        return
    }

    let foundStudent = null

    for (let key in students) {
        const student = students[key].find(
            s => s.usn === id && s.password === pass
        )

        if (student) {
            foundStudent = student
            foundStudent.classKey = key
            break
        }
    }

    if (!foundStudent) {
        error.innerText = "❌ Invalid credentials"
        shake()
        return
    }

    /* SAVE */
    localStorage.setItem("studentUSN", foundStudent.usn)
    localStorage.setItem("studentName", foundStudent.name)
    localStorage.setItem("studentClass", foundStudent.classKey)

    console.log("✅ Login success", foundStudent)

    /* LOADING */
    btn.classList.add("loading")

    setTimeout(() => {
        window.location.href = "student-dashboard.html"
    }, 800)


    /* SHAKE FUNCTION */
    function shake() {
        card.classList.add("shake")
        setTimeout(() => card.classList.remove("shake"), 400)
    }
}


/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Login Page Loaded")

    const btn = document.getElementById("loginBtn")
    const password = document.getElementById("password")
    const eye = document.getElementById("eyeIcon")

    /* CLICK */
    if (btn) {
        btn.addEventListener("click", studentLogin)
    }

    /* ENTER KEY */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") studentLogin()
    })

    /* PASSWORD TOGGLE */
    if (eye && password) {
        eye.addEventListener("click", () => {

            if (password.type === "password") {
                password.type = "text"
                eye.classList.replace("fa-eye", "fa-eye-slash")
            } else {
                password.type = "password"
                eye.classList.replace("fa-eye-slash", "fa-eye")
            }

        })
    }

})