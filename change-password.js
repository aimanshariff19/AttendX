const usn = localStorage.getItem("studentUSN")

/* -------- Message Box -------- */

function showMessage(text, type) {

    const box = document.getElementById("messageBox")

    box.innerText = text
    box.className = "message-box " + type
    box.style.display = "block"

    setTimeout(() => {
        box.style.display = "none"
    }, 3000)

}

/* -------- Shake Animation -------- */

function shakeForm() {

    const card = document.querySelector(".card")

    card.classList.add("shake")

    setTimeout(() => {
        card.classList.remove("shake")
    }, 400)

}

/* -------- Update Password -------- */

function updatePassword() {

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

    localStorage.setItem("password_" + usn, newPass)

    showMessage("Password updated successfully 🎉", "success")

    setTimeout(() => {
        window.location.href = "student-dashboard.html"
    }, 1200)

}

/* -------- Go Back -------- */

function goBack() {
    window.location.href = "student-dashboard.html"
}
