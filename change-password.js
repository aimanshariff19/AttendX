/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__CHANGE_PASS_RUNNING__) {
    throw new Error("Duplicate change password JS blocked")
}
window.__CHANGE_PASS_RUNNING__ = true


/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Change Password Loaded")

    const updateBtn = document.getElementById("updateBtn")
    const backBtn = document.getElementById("backBtn")

    if (updateBtn) updateBtn.addEventListener("click", updatePassword)
    if (backBtn) backBtn.addEventListener("click", goBack)
})


/* -------- USER -------- */
const usn = localStorage.getItem("studentUSN")

if (!usn) {
    console.warn("⚠ No user found, redirecting...")
    window.location.href = "student-login.html"
}


/* -------- MESSAGE -------- */
function showMessage(text, type) {

    const box = document.getElementById("messageBox")
    if (!box) return

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
    if (!card) return

    card.style.animation = "shake 0.4s"

    setTimeout(() => {
        card.style.animation = ""
    }, 400)
}


/* -------- UPDATE PASSWORD -------- */
function updatePassword() {

    const btn = document.getElementById("updateBtn")

    const oldPass = document.getElementById("oldPass")?.value.trim()
    const newPass = document.getElementById("newPass")?.value.trim()
    const confirmPass = document.getElementById("confirmPass")?.value.trim()

    if (!oldPass || !newPass || !confirmPass) {
        showMessage("⚠ Fill all fields", "error")
        shakeForm()
        return
    }

    const savedPass = localStorage.getItem("password_" + usn) || usn

    if (oldPass !== savedPass) {
        showMessage("❌ Old password incorrect", "error")
        shakeForm()
        return
    }

    if (newPass.length < 4) {
        showMessage("⚠ Password too short", "error")
        shakeForm()
        return
    }

    if (newPass !== confirmPass) {
        showMessage("❌ Passwords do not match", "error")
        shakeForm()
        return
    }

    /* -------- LOADING -------- */
    if (btn) {
        btn.classList.add("loading")
        btn.innerText = ""
    }

    setTimeout(() => {

        localStorage.setItem("password_" + usn, newPass)

        showMessage("✅ Password updated")

        document.querySelector(".dashboard")?.classList.add("page-exit")

        setTimeout(() => {
            window.location.href = "student-dashboard.html"
        }, 500)

    }, 800)
}


/* -------- BACK -------- */
function goBack() {
    window.location.href = "student-dashboard.html"
}