/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__CHANGE_PASS_RUNNING__) {
    throw new Error("Duplicate change password JS blocked")
}
window.__CHANGE_PASS_RUNNING__ = true


/* -------- USER -------- */
const usn = localStorage.getItem("studentUSN")

if (!usn) {
    console.warn("⚠ No user found, redirecting...")
    window.location.href = "student-login.html"
}


/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ Change Password Loaded")

    const updateBtn = document.getElementById("updateBtn")
    const backBtn = document.getElementById("backBtn")

    if (updateBtn) updateBtn.addEventListener("click", updatePassword)
    if (backBtn) backBtn.addEventListener("click", goBack)

    /* 👁 TOGGLE PASSWORD */
    function toggleEye(inputId, eyeId) {
        const input = document.getElementById(inputId)
        const eye = document.getElementById(eyeId)

        if (!input || !eye) return

        eye.addEventListener("click", () => {
            input.type = input.type === "password" ? "text" : "password"
        })
    }

    toggleEye("newPass", "eyeNew")
    toggleEye("confirmPass", "eyeConfirm")

    /* 📊 PASSWORD STRENGTH */
    const newPass = document.getElementById("newPass")
    const fill = document.getElementById("strengthFill")
    const text = document.getElementById("strengthText")

    if (newPass) {
        newPass.addEventListener("input", () => {

            let val = newPass.value
            let score = 0

            if (val.length >= 4) score++
            if (/[A-Z]/.test(val)) score++
            if (/[0-9]/.test(val)) score++
            if (/[^A-Za-z0-9]/.test(val)) score++

            const widths = ["0%", "25%", "50%", "75%", "100%"]
            if (fill) fill.style.width = widths[score]

            if (!text || !fill) return

            if (score <= 1) {
                fill.style.background = "#ef4444"
                text.innerText = "Weak"
            } else if (score === 2) {
                fill.style.background = "#f59e0b"
                text.innerText = "Medium"
            } else {
                fill.style.background = "#22c55e"
                text.innerText = "Strong"
            }
        })
    }
})


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