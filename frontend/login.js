/* -------- AUTO INIT -------- */

(function () {

    console.log("✅ Faculty Login JS Loaded")

    function handleFacultyLogin(e) {

        if (e) e.preventDefault()

        const username = document.getElementById("username")
        const password = document.getElementById("password")
        const loginCard = document.querySelector(".login-container")
        const error = document.getElementById("error")
        const btn = document.getElementById("loginBtn")
        const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]')

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

        // Call global login from utils.js to avoid naming conflict
        window.login(user, pass, 'faculty').then(userData => {
            if (userData) {
                // Save credentials if remember me is checked
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('faculty_id_saved', user)
                    localStorage.setItem('faculty_remember', 'true')
                } else {
                    localStorage.removeItem('faculty_id_saved')
                    localStorage.removeItem('faculty_remember')
                }

                loginCard.style.transition = "all 0.4s ease"
                loginCard.style.opacity = "0"
                loginCard.style.transform = "scale(0.95)"

                setTimeout(() => {
                    window.location.href = "dashboard.html"
                }, 400)
            } else {
                error.innerText = "❌ Invalid Faculty Credentials";
                shake();
                btn.classList.remove("loading");
                if (text) text.innerText = "Login";
                if (loader) loader.style.display = "none";
            }
        }).catch(err => {
            error.innerText = "❌ " + err.message;
            shake();
            btn.classList.remove("loading");
            if (text) text.innerText = "Login";
            if (loader) loader.style.display = "none";
        });

    }

    function init() {

        const btn = document.getElementById("loginBtn")
        const form = document.getElementById("loginForm")
        const password = document.getElementById("password")
        const eye = document.getElementById("eyeIcon")
        const username = document.getElementById("username")
        const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]')
        const forgotLink = document.querySelector('.forgot')

        // Restore saved credentials
        const savedId = localStorage.getItem('faculty_id_saved')
        const shouldRemember = localStorage.getItem('faculty_remember') === 'true'
        
        if (savedId && shouldRemember) {
            if (username) username.value = savedId
            if (rememberCheckbox) rememberCheckbox.checked = true
        }

        if (btn) btn.onclick = handleFacultyLogin

        if (form) {
            form.onsubmit = function (e) {
                e.preventDefault()
                handleFacultyLogin(e)
            }
        }

        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleFacultyLogin(e)
        })

        if (eye && password) {
            eye.addEventListener("click", () => {
                if (password.type === "password") {
                    password.type = "text"
                    eye.classList.remove("fa-eye")
                    eye.classList.add("fa-eye-slash")
                } else {
                    password.type = "password"
                    eye.classList.remove("fa-eye-slash")
                    eye.classList.add("fa-eye")
                }
            })
        }

        /* FORGOT PASSWORD */
        if (forgotLink) {
            forgotLink.onclick = (e) => {
                e.preventDefault()
                const email = username ? username.value : ''
                alert('Password Reset\n\nPlease contact your administrator at admin@atria.edu to reset your password.\n\nFaculty ID: ' + email)
            }
        }

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
