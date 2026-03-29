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

        if (!username || !password || !btn) {
            console.error("❌ Missing elements")
            return
        }

        error.innerText = ""

        const user = username.value.trim()
        const pass = password.value.trim()

        /* -------- EMPTY -------- */
        if (!user) {
            error.innerText = "⚠ Enter Faculty ID"
            shake()
            return
        }

        /* -------- SUCCESS -------- */
        function successLogin(data, redirectPage) {

            btn.classList.add("loading")

            const text = btn.querySelector(".btn-text")
            if (text) text.style.opacity = "0"

            setTimeout(() => {

                // clear old session
                localStorage.clear()

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

        /* -------- 🔥 FACULTY LOGIN (FROM mockData) -------- */
        if (typeof facultyList !== "undefined") {

            const faculty = facultyList.find(
                f => f.id === user
            )

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

        /* -------- HOD LOGIN (IF USED) -------- */
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

        /* -------- INVALID -------- */
        error.innerText = "❌ Invalid Faculty ID"
        shake()
    }


    /* -------- INIT -------- */
    function init() {

        console.log("✅ JS Bound")

        const btn = document.getElementById("loginBtn")
        const form = document.getElementById("loginForm")
        const password = document.getElementById("password")
        const eye = document.getElementById("eyeIcon")

        /* BUTTON */
        if (btn) btn.onclick = login

        /* FORM */
        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault()
                login(e)
            }
        }

        /* ENTER */
        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
                login(e)
            }
        })

        /* PASSWORD TOGGLE */
        if (eye && password) {
            eye.onclick = function () {
                password.type = password.type === "password" ? "text" : "password"
                eye.className =
                    password.type === "text"
                        ? "fa-solid fa-eye-slash eye"
                        : "fa-solid fa-eye eye"
            }
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

    /* RUN */
    if (document.readyState === "complete") {
        init()
    } else {
        window.addEventListener("load", init)
    }

})();

document.getElementById("loginBtn").onclick = function () {
    window.location.href = "dashboard.html"
}