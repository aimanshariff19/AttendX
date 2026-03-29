/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__CHANGE_PASS_RUNNING__) {
    throw new Error("Duplicate change password JS blocked")
}
window.__CHANGE_PASS_RUNNING__ = true


/* -------- USER -------- */
const usn = localStorage.getItem("studentUSN")

if (!usn) {
    window.location.href = "student-login.html"
}


/* -------- 💧 RIPPLE -------- */
document.addEventListener("click", function (e) {

    const btn = e.target.closest("button")
    if (!btn) return

    if (btn.querySelector(".ripple")) return

    const circle = document.createElement("span")
    circle.classList.add("ripple")

    const rect = btn.getBoundingClientRect()

    circle.style.left = (e.clientX - rect.left) + "px"
    circle.style.top = (e.clientY - rect.top) + "px"

    btn.appendChild(circle)

    setTimeout(() => circle.remove(), 600)
})


/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Change Password Page Loaded")

    const updateBtn = document.getElementById("updateBtn")
    const backBtn = document.getElementById("backBtn")

    if (updateBtn) updateBtn.addEventListener("click", updatePassword)
    if (backBtn) backBtn.addEventListener("click", goBack)
})


/* -------- MESSAGE BOX -------- */
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

    let oldPass = document.getElementById("oldPass").value.trim()
    let newPass = document.getElementById("newPass").value.trim()
    let confirmPass = document.getElementById("confirmPass").value.trim()

    let savedPass = localStorage.getItem("password_" + usn) || usn

    if (!oldPass || !newPass || !confirmPass) {
        showMessage("⚠ Fill all fields", "error")
        shakeForm()
        return
    }

    if (oldPass !== savedPass) {
        showMessage("❌ Old password is incorrect", "error")
        shakeForm()
        return
    }

    if (newPass.length < 4) {
        showMessage("⚠ Password must be at least 4 characters", "error")
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

        showMessage("✅ Password updated successfully")

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