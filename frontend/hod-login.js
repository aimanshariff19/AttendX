function hodLogin() {
    const btn = document.getElementById("loginBtn")
    const usernameInput = document.getElementById("username")
    const passwordInput = document.getElementById("password")
    const errorBox = document.getElementById("error")
    const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]')

    const username = usernameInput.value.trim()
    const password = passwordInput.value.trim()

    errorBox.innerText = ""
    errorBox.style.display = "none"

    function shake() {
        const loginCard = document.querySelector(".login-container")
        if (loginCard) {
            loginCard.classList.remove("shake")
            void loginCard.offsetWidth
            loginCard.classList.add("shake")
            setTimeout(() => loginCard.classList.remove("shake"), 400)
        }
    }

    function resetBtn() {
        btn.classList.remove("loading")
        const text = btn.querySelector(".btn-text")
        const loader = btn.querySelector(".btn-loader")
        if (text) text.innerText = "Login"
        if (loader) loader.style.display = "none"
    }

    /* 🔥 VALIDATION */
    if (!username || !password) {
        errorBox.innerText = "⚠ Please fill all fields"
        errorBox.style.display = "block"
        shake()
        return
    }

    /* 🔥 PREVENT DOUBLE CLICK */
    if (btn.classList.contains("loading")) return

    btn.classList.add("loading")
    const text = btn.querySelector(".btn-text")
    const loader = btn.querySelector(".btn-loader")
    if (text) text.innerText = "Logging in..."
    if (loader) loader.style.display = "inline-block"

    window.login(username, password, 'hod').then(userData => {
        if (userData) {
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('hod_id_saved', username)
                localStorage.setItem('hod_remember', 'true')
            } else {
                localStorage.removeItem('hod_id_saved')
                localStorage.removeItem('hod_remember')
            }

            const card = document.querySelector(".login-container")
            if (card) {
                card.style.transition = "all 0.4s ease"
                card.style.opacity = "0"
                card.style.transform = "scale(0.95)"
            }
            setTimeout(() => {
                window.location.href = "hod-intro.html"
            }, 400)
        } else {
            errorBox.innerText = "❌ Invalid HOD Credentials"
            errorBox.style.display = "block"
            shake()
            resetBtn()
        }
    }).catch(err => {
        errorBox.innerText = "❌ " + err.message
        errorBox.style.display = "block"
        shake()
        resetBtn()
    })
}

/* Initialize HOD Login */
window.addEventListener("load", () => {
    const usernameInput = document.getElementById("username")
    const passwordInput = document.getElementById("password")
    const eyeIcon = document.getElementById("eyeIcon")
    const rememberCheckbox = document.querySelector('.remember input[type="checkbox"]')
    const form = document.getElementById("loginForm")

    // Password Toggle
    if (eyeIcon && passwordInput) {
        eyeIcon.onclick = () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'
            passwordInput.setAttribute('type', type)
            eyeIcon.classList.toggle('fa-eye')
            eyeIcon.classList.toggle('fa-eye-slash')
        }
    }

    // Restore saved credentials
    const savedId = localStorage.getItem('hod_id_saved')
    const shouldRemember = localStorage.getItem('hod_remember') === 'true'
    
    if (savedId && shouldRemember) {
        if (usernameInput) usernameInput.value = savedId
        if (rememberCheckbox) rememberCheckbox.checked = true
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault()
            hodLogin()
        }
    }

    /* FORGOT PASSWORD - Handled by HTML link now */
})
