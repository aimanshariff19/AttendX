function studentLogin() {

    const idInput = document.getElementById("studentId")
    const passInput = document.getElementById("password")
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")
    const card = document.querySelector(".login-container")

    const studentId = idInput.value.trim()
    const password = passInput.value.trim()

    error.innerText = ""

    // 🔹 Validation
    if (!studentId || !password) {
        showError("Please fill all fields")
        return
    }

    let foundStudent = null
    let studentClassKey = null

    // 🔥 LOOP THROUGH ALL GROUPS
    for (let key in students) {

        const group = students[key]

        const match = group.find(s =>
            s.usn === studentId && s.password === password
        )

        if (match) {
            foundStudent = match
            studentClassKey = key

            const [department, program, sem, section] = key.split("_")

            localStorage.setItem("branch", program)
            localStorage.setItem("sem", sem)
            localStorage.setItem("section", section)

            break
        }
    }

    // 🔥 SUCCESS LOGIN
    if (foundStudent) {

        // 🌀 LOADING
        btn.classList.add("loading")
        btn.innerText = ""

        setTimeout(() => {

            localStorage.setItem("role", "student")
            localStorage.setItem("studentUSN", foundStudent.usn)
            localStorage.setItem("studentName", foundStudent.name)
            localStorage.setItem("studentClass", studentClassKey)

            // 🚀 PAGE EXIT
            document.querySelector(".login-container").classList.add("page-exit")

            setTimeout(() => {
                window.location.href = "student-dashboard.html"
            }, 400)

        }, 700)

    } else {
        showError("Invalid Student ID or Password ❌")
    }


    /* -------- ERROR HANDLER -------- */

    function showError(msg) {

        error.innerText = msg

        card.style.animation = "shake 0.4s"

        idInput.classList.add("input-error")
        passInput.classList.add("input-error")

        passInput.value = ""

        setTimeout(() => {
            card.style.animation = ""
            idInput.classList.remove("input-error")
            passInput.classList.remove("input-error")
        }, 500)
    }
}


/* -------- PASSWORD TOGGLE -------- */

document.addEventListener("DOMContentLoaded", () => {

    const eyeIcon = document.getElementById("eyeIcon")
    const passwordInput = document.getElementById("password")

    if (!eyeIcon || !passwordInput) return

    eyeIcon.addEventListener("click", () => {

        const isPassword = passwordInput.type === "password"

        passwordInput.type = isPassword ? "text" : "password"

        eyeIcon.classList.toggle("fa-eye")
        eyeIcon.classList.toggle("fa-eye-slash")

    })

})

// 💧 Ripple
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

        // 👁 Toggle password
        document.getElementById("eyeIcon").addEventListener("click", () => {
            const pass = document.getElementById("password")
            const icon = document.getElementById("eyeIcon")

            if (pass.type === "password") {
                pass.type = "text"
                icon.classList.replace("fa-eye", "fa-eye-slash")
            } else {
                pass.type = "password"
                icon.classList.replace("fa-eye-slash", "fa-eye")
            }
        })