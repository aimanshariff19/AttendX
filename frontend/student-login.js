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
function handleStudentLogin(e) {

    if (e) e.preventDefault()

    const idInput = document.getElementById("studentId")
    const passInput = document.getElementById("password")
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")
    const card = document.querySelector(".login-container")
    const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]')

    if (!idInput || !passInput || !btn) return

    const id = idInput.value.trim()
    const pass = passInput.value.trim()

    error.innerText = ""

    if (!id || !pass) {
        error.innerText = "⚠ Enter ID & Password"
        shake()
        return
    }

    if (btn.classList.contains("loading")) return

    btn.classList.add("loading")

    const text = btn.querySelector(".btn-text")
    const loader = btn.querySelector(".btn-loader")

    if (text) text.innerText = "Logging in..."
    if (loader) loader.style.display = "inline-block"

    function shake() {
        if (!card) return
        card.classList.remove("shake")
        void card.offsetWidth
        card.classList.add("shake")
        setTimeout(() => card.classList.remove("shake"), 400)
    }

    function resetBtn() {
        btn.classList.remove("loading")
        if (text) text.innerText = "Login"
        if (loader) loader.style.display = "none"
    }

    // Call the global login function from utils.js
    window.login(id, pass, 'student').then(userData => {
        if (userData) {
            // Save credentials if remember me is checked
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('student_id_saved', id)
                localStorage.setItem('student_remember', 'true')
            } else {
                localStorage.removeItem('student_id_saved')
                localStorage.removeItem('student_remember')
            }

            card.style.transition = "all 0.4s ease"
            card.style.opacity = "0"
            card.style.transform = "scale(0.95)"
            setTimeout(() => {
                window.location.href = 'student-dashboard.html'
            }, 400)
        } else {
            error.innerText = '❌ Invalid Student Credentials'
            shake()
            resetBtn()
        }
    }).catch(err => {
        error.innerText = '❌ ' + err.message
        shake()
        resetBtn()
    })
}


/* -------- INIT -------- */
window.addEventListener("load", () => {

    console.log("✅ Student Login Loaded")

    const btn = document.getElementById("loginBtn")
    const form = document.getElementById("studentForm")
    const password = document.getElementById("password")
    const eye = document.getElementById("eyeIcon")
    const idInput = document.getElementById("studentId")
    const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]')
    const forgotLink = document.querySelector('.forgot')

    // Restore saved credentials
    const savedId = localStorage.getItem('student_id_saved')
    const shouldRemember = localStorage.getItem('student_remember') === 'true'
    
    if (savedId && shouldRemember) {
        if (idInput) idInput.value = savedId
        if (rememberCheckbox) rememberCheckbox.checked = true
    }

    /* CLICK */
    if (btn) btn.onclick = handleStudentLogin

    /* FORM SUBMIT */
    if (form) {
        form.onsubmit = handleStudentLogin
    }

    /* ENTER */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
            handleStudentLogin(e)
        }
    })

    /* PASSWORD TOGGLE */
    if (eye && password) {
        eye.onclick = () => {
            password.type = password.type === "password" ? "text" : "password"
            eye.classList.toggle("fa-eye")
            eye.classList.toggle("fa-eye-slash")
        }
    }

    /* FORGOT PASSWORD */
    if (forgotLink) {
        forgotLink.onclick = (e) => {
            e.preventDefault()
            const email = idInput ? idInput.value : ''
            alert('Password Reset\n\nPlease contact your administrator at admin@atria.edu to reset your password.\n\nStudent ID: ' + email)
        }
    }

})
