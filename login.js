/* -------- AUTO INIT -------- */

(function () {

    console.log("✅ Faculty Login JS Loaded")

    function login(e) {

        if (e) e.preventDefault()

        const username = document.getElementById("username")
        const password = document.getElementById("password")
        const loginCard = document.querySelector(".login-container")
        const error = document.getElementById("error")
        const btn = document.getElementById("loginBtn")

        error.innerText = ""

        const user = username.value.trim()
        const pass = password.value.trim()

        /* -------- SHAKE -------- */
        function shake() {
            loginCard.classList.remove("shake")
            void loginCard.offsetWidth
            loginCard.classList.add("shake")

            setTimeout(() => loginCard.classList.remove("shake"), 400)
        }

        /* -------- VALIDATION -------- */
        if (!user || !pass) {
            error.innerText = "⚠ Please fill all fields"
            shake()
            return
        }

        /* -------- PREVENT DOUBLE CLICK -------- */
        if (btn.classList.contains("loading")) return

        /* -------- LOADING START -------- */
        btn.classList.add("loading")

        const text = btn.querySelector(".btn-text")
        const loader = btn.querySelector(".btn-loader")

        if (text) text.innerText = "Logging in..."
        if (loader) loader.style.display = "inline-block"

        setTimeout(() => {

            function successLogin(data, redirectPage) {

                localStorage.clear()
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key])
                })

                loginCard.style.transition = "all 0.4s ease"
                loginCard.style.opacity = "0"
                loginCard.style.transform = "scale(0.95)"

                setTimeout(() => {
                    window.location.href = redirectPage
                }, 400)
            }

            /* FACULTY LOGIN */
            if (typeof facultyList !== "undefined") {

                const faculty = facultyList.find(f => f.id === user)

                if (faculty) {
                    successLogin({
                        role: "faculty",
                        name: faculty.name,
                        department: faculty.department,
                        user: faculty.id
                    }, "dashboard.html")
                    return
                }
            }

            /* HOD LOGIN */
            if (typeof hods !== "undefined") {

                const hod = hods.find(
                    h => h.username === user && h.password === pass
                )

                if (hod) {
                    successLogin({
                        role: "hod",
                        name: hod.name,
                        department: hod.department
                    }, "hod-dashboard.html")
                    return
                }
            }

            error.innerText = "❌ Invalid Credentials"
            shake()

            btn.classList.remove("loading")
            if (text) text.innerText = "Login"
            if (loader) loader.style.display = "none"

        }, 1200)

    }

    function init() {

        const btn = document.getElementById("loginBtn")
        const form = document.getElementById("loginForm")
        const password = document.getElementById("password")
        const eye = document.getElementById("eyeIcon")

        /* CLICK LOGIN */
        if (btn) btn.onclick = login

        /* SUBMIT */
        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault()
                login(e)
            }
        }

        /* ENTER KEY */
        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter") login(e)
        })

        /* 🔥 FIXED PASSWORD TOGGLE (STUDENT STYLE) */
        if (eye && password) {
            eye.addEventListener("click", () => {
                password.type = password.type === "password" ? "text" : "password"
                eye.classList.toggle("fa-eye-slash")
            })
        }

        /* RIPPLE */
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
    }

    if (document.readyState === "complete") {
        init()
    } else {
        window.addEventListener("load", init)
    }

})();