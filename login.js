/* -------- AUTO INIT (FINAL MERGED VERSION) -------- */

(function () {

    console.log("✅ Login JS Loaded")

    function login(e) {

        if (e) e.preventDefault()

        const username = document.getElementById("username")
        const password = document.getElementById("password")
        const loginCard = document.querySelector(".login-container")
        const error = document.getElementById("error")
        const btn = document.getElementById("loginBtn")

        if (!username || !password || !btn) {
            console.error("❌ Missing elements")
            return
        }

        error.innerText = ""

        const user = username.value.trim()
        const pass = password.value.trim()

        /* -------- EMPTY -------- */
        if (!user || !pass) {
            error.innerText = "⚠ Enter all fields"
            shake()
            return
        }

        /* -------- SUCCESS -------- */
        function successLogin(data, redirectPage) {

            btn.classList.add("loading")

            const text = btn.querySelector(".btn-text")
            if (text) text.style.opacity = "0"

            setTimeout(() => {

                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key])
                })

                if (loginCard) {
                    loginCard.style.transition = "0.4s"
                    loginCard.style.transform = "scale(0.95)"
                    loginCard.style.opacity = "0"
                }

                setTimeout(() => {
                    window.location.href = redirectPage
                }, 600)

            }, 500)
        }

        /* -------- SHAKE -------- */
        function shake() {
            if (!loginCard) return
            loginCard.classList.add("shake")
            setTimeout(() => loginCard.classList.remove("shake"), 400)
        }

        /* -------- FACULTY -------- */
        if (user === "faculty1" && pass === "1234") {
            successLogin({
                role: "faculty",
                facultyName: "Prof.Keerthi"
            }, "dashboard.html")
            return
        }

        if (user === "faculty2" && pass === "1234") {
            successLogin({
                role: "faculty",
                facultyName: "Prof.Geeta"
            }, "dashboard.html")
            return
        }

        /* -------- HOD -------- */
        if (typeof hods !== "undefined") {
            const hod = hods.find(h => h.username === user && h.password === pass)

            if (hod) {
                successLogin({
                    role: "hod",
                    hodName: hod.name
                }, "hod-dashboard.html")
                return
            }
        }

        /* -------- INVALID -------- */
        error.innerText = "❌ Invalid credentials"
        shake()
    }


    /* -------- INIT -------- */
    function init() {

        console.log("✅ JS Bound")

        const btn = document.getElementById("loginBtn")
        const form = document.getElementById("loginForm")
        const password = document.getElementById("password")
        const eye = document.getElementById("eyeIcon")

        /* 🔥 BUTTON CLICK */
        if (btn) {
            btn.onclick = login
        }

        /* 🔥 FORM SUBMIT BLOCK */
        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault()
                login(e)
            }
        }

        /* 🔥 ENTER KEY */
        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault()
                login(e)
            }
        })

        /* 👁 PASSWORD TOGGLE */
        if (eye && password) {
            eye.onclick = function () {
                if (password.type === "password") {
                    password.type = "text"
                    eye.className = "fa-solid fa-eye-slash eye"
                } else {
                    password.type = "password"
                    eye.className = "fa-solid fa-eye eye"
                }
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


    /* -------- RUN (SAFE LOAD) -------- */
    if (document.readyState === "complete") {
        init()
    } else {
        window.addEventListener("load", init)
    }

})();