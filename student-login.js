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
function login(e) {

    if (e) e.preventDefault()

    const idInput = document.getElementById("studentId")
    const passInput = document.getElementById("password")
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")
    const card = document.querySelector(".login-container")

    if (!idInput || !passInput || !btn) return

    const id = idInput.value.trim()
    const pass = passInput.value.trim()

    error.innerText = ""

    /* EMPTY */
    if (!id || !pass) {
        error.innerText = "⚠ Enter ID & Password"
        shake()
        return
    }

    /* PREVENT DOUBLE CLICK */
    if (btn.classList.contains("loading")) return

    /* 🔥 START LOADING */
    btn.classList.add("loading")

    const text = btn.querySelector(".btn-text")
    const loader = btn.querySelector(".btn-loader")

    if (text) text.innerText = "Logging in..."
    if (loader) loader.style.display = "inline-block"

    setTimeout(() => {

        /* DATA CHECK */
        if (typeof students === "undefined") {
            error.innerText = "❌ Data not loaded"
            resetBtn()
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
            resetBtn()
            return
        }

        /* SAVE */
        localStorage.clear()
        localStorage.setItem("studentUSN", foundStudent.usn)
        localStorage.setItem("studentName", foundStudent.name)
        localStorage.setItem("studentClass", foundStudent.classKey)

        console.log("✅ Login success", foundStudent)

        /* SUCCESS REDIRECT */
        setTimeout(() => {
            window.location.href = "student-dashboard.html"
        }, 400)

    }, 800)


    function resetBtn() {
        btn.classList.remove("loading")
        if (text) text.innerText = "Login"
        if (loader) loader.style.display = "none"
    }

    function shake() {
        if (!card) return
        card.classList.add("shake")
        setTimeout(() => card.classList.remove("shake"), 400)
    }
}


/* -------- INIT -------- */
window.addEventListener("load", () => {

    console.log("✅ Student Login Loaded")

    const btn = document.getElementById("loginBtn")
    const form = document.getElementById("studentForm")
    const password = document.getElementById("password")
    const eye = document.getElementById("eyeIcon")

    /* CLICK */
    if (btn) btn.onclick = login

    /* FORM SUBMIT */
    if (form) {
        form.onsubmit = login
    }

    /* ENTER */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
            login(e)
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

})