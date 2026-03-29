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

    function successLogin(data, redirectPage) {

        btn.classList.add("loading")

        /* 🔥 ADD: hide button text smoothly */
        const text = btn.querySelector(".btn-text")
        if (text) text.style.opacity = "0"

        setTimeout(() => {

            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key])
            })

            /* 🔥 ADD: success popup */
            const pop = document.getElementById("successPop")
            if (pop) pop.classList.add("show")

            /* 🔥 ADD: exit animation */
            loginCard.style.transform = "scale(0.95)"
            loginCard.style.opacity = "0"

            setTimeout(() => {
                window.location.href = redirectPage
            }, 800)

        }, 700)
    }

    /* -------- FACULTY LOGIN -------- */

    if (user === "faculty1" && pass === "1234") {

        successLogin({
            role: "faculty",
            faculty: "faculty1",
            facultyName: "Prof.Keerthi",
            department: "CSE"
        }, "dashboard.html")

        return
    }

    if (user === "faculty2" && pass === "1234") {

        successLogin({
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

        successLogin({
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


/* -------- DOM READY -------- */

document.addEventListener("DOMContentLoaded", () => {

    /* 👁 PASSWORD TOGGLE (FINAL FIX) */

    const eyeIcon = document.getElementById("eyeIcon")
    const password = document.getElementById("password")

    if (eyeIcon && password) {

        eyeIcon.onclick = function () {

            if (password.type === "password") {
                password.type = "text"
                eyeIcon.className = "fa-solid fa-eye-slash eye"
            } else {
                password.type = "password"
                eyeIcon.className = "fa-solid fa-eye eye"
            }

        }

    }

    /* 💧 RIPPLE EFFECT */

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

})

function loginbtn{
    window.location.href = "dashboard.html"
}