function setLoading(isLoading) {
    const btn = document.getElementById("loginBtn")
    const text = btn?.querySelector(".btn-text")
    const loader = btn?.querySelector(".btn-loader")
    if (!btn) return
    btn.classList.toggle("loading", isLoading)
    if (text) text.innerText = isLoading ? "Logging in..." : "Login"
    if (loader) loader.style.display = isLoading ? "inline-block" : "none"
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm")
    const error = document.getElementById("error")
    const eye = document.getElementById("eyeIcon")
    const password = document.getElementById("password")

    if (eye && password) {
        eye.addEventListener("click", () => {
            password.type = password.type === "password" ? "text" : "password"
            eye.classList.toggle("fa-eye")
            eye.classList.toggle("fa-eye-slash")
        })
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault()
        error.innerText = ""

        const id = document.getElementById("username").value.trim()
        const pass = password.value.trim()
        if (!id || !pass) {
            error.innerText = "Please fill all fields"
            return
        }

        try {
            setLoading(true)
            const user = await login(id, pass, "admin")
            if (user) window.location.href = "admin-panel.html"
        } catch (err) {
            error.innerText = err.message || "Invalid admin credentials"
        } finally {
            setLoading(false)
        }
    })
})
