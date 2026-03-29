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
        const success = document.getElementById("successCheck")

        error.innerText = ""

        const user = username.value.trim()
        const pass = password.value.trim()

        /* -------- VALIDATION -------- */
        if (!user || !pass) {
            error.innerText = "⚠ Please fill all fields"
            shake()
            return
        }

        /* -------- LOADING -------- */
        btn.classList.add("loading")

        /* -------- SHAKE -------- */
        function shake() {
            loginCard.classList.add("shake")
            setTimeout(() => loginCard.classList.remove("shake"), 500)
        }

        /* -------- SUCCESS -------- */
        function successLogin(data, redirectPage) {

            setTimeout(() => {

                /* SAVE SESSION */
                localStorage.clear()
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key])
                })

                /* SHOW SUCCESS ✔ */
                success.style.display = "block"

                /* EXIT ANIMATION */
                setTimeout(() => {
                    loginCard.style.transform = "scale(0.9)"
                    loginCard.style.opacity = "0"
                }, 300)

                setTimeout(() => {
                    window.location.href = redirectPage
                }, 900)

            }, 800)
        }

        /* -------- LOGIN LOGIC -------- */
        setTimeout(() => {

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

            /* -------- ERROR -------- */
            error.innerText = "❌ Invalid Credentials"
            shake()

            btn.classList.remove("loading")

        }, 1200)

    }

    function init() {

        const btn = document.getElementById("loginBtn")
        const form = document.getElementById("loginForm")
        const password = document.getElementById("password")
        const eye = document.getElementById("eyeIcon")

        if (btn) btn.onclick = login

        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault()
                login(e)
            }
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter") login(e)
        })

        /* 👁 PASSWORD TOGGLE */
        if (eye && password) {
            eye.onclick = function () {
                password.type = password.type === "password" ? "text" : "password"
                eye.classList.toggle("fa-eye-slash")
            }
        }

        /* 💧 RIPPLE */
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