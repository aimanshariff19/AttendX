function login() {

    const username = document.getElementById("username")
    const password = document.getElementById("password")
    const loginCard = document.querySelector(".login-container")
    const error = document.getElementById("error")

    error.innerText = ""

    /* -------- Faculty Login -------- */

    if (username.value === "faculty1" && password.value === "1234") {

        localStorage.setItem("role", "faculty")
        localStorage.setItem("faculty", "faculty1")
        localStorage.setItem("facultyName", "Prof.Keerthi")
        localStorage.setItem("department", "CSE")

        window.location.href = "dashboard.html"
        return
    }

    if (username.value === "faculty2" && password.value === "1234") {

        localStorage.setItem("role", "faculty")
        localStorage.setItem("faculty", "faculty2")
        localStorage.setItem("facultyName", "Prof.Geeta")
        localStorage.setItem("department", "CSE")

        window.location.href = "dashboard.html"
        return
    }

    /* -------- HOD Login -------- */

    const hod = hods.find(
        h => h.username === username.value && h.password === password.value
    )

    if (hod) {

        localStorage.setItem("role", "hod")
        localStorage.setItem("hodDepartment", hod.department)
        localStorage.setItem("hodName", hod.name)

        window.location.href = "hod-dashboard.html"
        return
    }

    /* -------- Invalid Login -------- */

    error.innerText = "Invalid Login"

    loginCard.classList.add("shake")

    username.classList.add("input-error")
    password.classList.add("input-error")

    password.value = ""

    setTimeout(() => {
        loginCard.classList.remove("shake")
        username.classList.remove("input-error")
        password.classList.remove("input-error")
    }, 600)

}


/* -------- Toggle Password Visibility -------- */

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