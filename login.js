/* -------- LOGIN -------- */

function login() {

    const username = document.getElementById("username")
    const password = document.getElementById("password")
    const loginCard = document.querySelector(".login-container")
    const error = document.getElementById("error")
    const btn = document.getElementById("loginBtn")

    error.innerText = ""

    const user = username.value.trim()
    const pass = password.value.trim()

    /* -------- HELPER: SUCCESS -------- */

    function successLogin(role, data, redirectPage) {

        // 🌀 LOADING
        btn.classList.add("loading")
        btn.innerText = ""

        setTimeout(() => {

            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key])
            })

            // 🚀 PAGE EXIT
            document.querySelector(".login-container").classList.add("page-exit")

            setTimeout(() => {
                window.location.href = redirectPage
            }, 400)

        }, 700)
    }

    /* -------- FACULTY LOGIN -------- */

    if (user === "faculty1" && pass === "1234") {

        successLogin("faculty", {
            role: "faculty",
            faculty: "faculty1",
            facultyName: "Prof.Keerthi",
            department: "CSE"
        }, "dashboard.html")

        return
    }

    if (user === "faculty2" && pass === "1234") {

        successLogin("faculty", {
            role: "faculty",
            faculty: "faculty2",
            facultyName: "Prof.Geeta",
            department: "CSE"
        }, "dashboard.html")

        return
    }

    /* -------- HOD LOGIN -------- */

    const hod = hods.find(
        h => h.username === user && h.password === pass
    )

    if (hod) {

        successLogin("hod", {
            role: "hod",
            hodDepartment: hod.department,
            hodName: hod.name
        }, "hod-dashboard.html")

        return
    }

    /* -------- INVALID LOGIN -------- */

    error.innerText = "Invalid username or password ❌"

    loginCard.classList.add("shake")

    username.classList.add("input-error")
    password.classList.add("input-error")

    password.value = ""

    setTimeout(() => {
        loginCard.classList.remove("shake")
        username.classList.remove("input-error")
        password.classList.remove("input-error")
    }, 500)
}


/* -------- PASSWORD TOGGLE -------- */

document.addEventListener("DOMContentLoaded", () => {

    const eyeIcon = document.getElementById("eyeIcon")

    if (eyeIcon) {

        eyeIcon.addEventListener("click", function () {

            const password = document.getElementById("password")

            if (password.type === "password") {
                password.type = "text"
                this.classList.replace("fa-eye", "fa-eye-slash")
            } else {
                password.type = "password"
                this.classList.replace("fa-eye-slash", "fa-eye")
            }

        })

    }

})