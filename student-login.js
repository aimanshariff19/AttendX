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
function studentLogin(e) {

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

    /* SAVE (🔥 CLEAR OLD DATA) */
    localStorage.clear()
    localStorage.setItem("studentUSN", foundStudent.usn)
    localStorage.setItem("studentName", foundStudent.name)
    localStorage.setItem("studentClass", foundStudent.classKey)

    console.log("✅ Login success", foundStudent)

    /* LOADING */
    btn.classList.add("loading")

    setTimeout(() => {
        window.location.href = "student-dashboard.html"
    }, 800)


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
    if (btn) btn.onclick = studentLogin

    /* FORM SUBMIT */
    if (form) {
        form.onsubmit = studentLogin
    }

    /* ENTER (ONLY IF INPUT FOCUSED) */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
            studentLogin(e)
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