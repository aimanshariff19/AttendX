/* -------- USER -------- */

const usn = localStorage.getItem("studentUSN")


/* -------- MESSAGE BOX -------- */

function showMessage(text, type) {

    const box = document.getElementById("messageBox")

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 2500)
}


/* -------- SHAKE -------- */

function shakeForm() {

    const card = document.querySelector(".card")

    card.style.animation = "shake 0.4s"

    setTimeout(() => {
        card.style.animation = ""
    }, 400)
}


/* -------- 💧 RIPPLE EFFECT -------- */

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


/* -------- 🚀 UPDATE PASSWORD -------- */

function updatePassword() {

    const btn = document.getElementById("updateBtn")

    let oldPass = document.getElementById("oldPass").value.trim()
    let newPass = document.getElementById("newPass").value.trim()
    let confirmPass = document.getElementById("confirmPass").value.trim()

    let savedPass = localStorage.getItem("password_" + usn) || usn

    if (oldPass !== savedPass) {
        showMessage("Old password is incorrect", "error")
        shakeForm()
        return
    }

    if (newPass.length < 4) {
        showMessage("Password must be at least 4 characters", "error")
        shakeForm()
        return
    }

    if (newPass !== confirmPass) {
        showMessage("Passwords do not match", "error")
        shakeForm()
        return
    }

    // 🔥 START LOADING
    btn.classList.add("loading")
    btn.innerText = ""

    setTimeout(() => {

        localStorage.setItem("password_" + usn, newPass)

        showMessage("Password updated successfully 🎉", "success")

        // 🔥 PAGE EXIT ANIMATION
        document.querySelector(".dashboard").classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "student-dashboard.html"
        }, 500)

    }, 900)
}


/* -------- NAV -------- */

function goBack() {
    window.location.href = "student-dashboard.html"
}