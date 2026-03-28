function hodLogin() {

    const btn = document.querySelector("button")

    const username = document.getElementById("username").value.trim()
    const password = document.getElementById("password").value.trim()
    const errorBox = document.getElementById("error")

    // 🔥 RESET ERROR
    errorBox.innerText = ""
    errorBox.style.display = "none"

    const hod = hods.find(
        h => h.username === username && h.password === password
    )

    if (!hod) {

        errorBox.innerText = "Invalid username or password ❌"
        errorBox.style.display = "block"

        // 🔥 SHAKE EFFECT
        const form = document.querySelector(".card")
        form.style.animation = "shake 0.4s"

        setTimeout(() => {
            form.style.animation = ""
        }, 400)

        return
    }

    // 🌀 LOADING STATE
    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        localStorage.setItem("hodDepartment", hod.department)
        localStorage.setItem("hodName", hod.name)

        // 🚀 PAGE EXIT
        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "hod-dashboard.html"
        }, 500)

    }, 900)
}