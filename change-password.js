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

    console.log("🔥 INSANE Change Password Loaded")

    const updateBtn = document.getElementById("updateBtn")
    const backBtn = document.getElementById("backBtn")

    if (updateBtn) updateBtn.addEventListener("click", updatePassword)
    if (backBtn) backBtn.addEventListener("click", goBack)

    const newPass = document.getElementById("newPass")
    const confirmPass = document.getElementById("confirmPass")

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
    const fill = document.getElementById("strengthFill")
    const text = document.getElementById("strengthText")

    /* 📋 RULES */
    const ruleLen = document.getElementById("ruleLen")
    const ruleUpper = document.getElementById("ruleUpper")
    const ruleNum = document.getElementById("ruleNum")
    const ruleSpecial = document.getElementById("ruleSpecial")

    if (newPass) {
        newPass.addEventListener("input", () => {

            let val = newPass.value
            let score = 0

            const checks = {
                len: val.length >= 4,
                upper: /[A-Z]/.test(val),
                num: /[0-9]/.test(val),
                special: /[^A-Za-z0-9]/.test(val)
            }

            if (checks.len) score++
            if (checks.upper) score++
            if (checks.num) score++
            if (checks.special) score++

            /* -------- RULES UPDATE -------- */
            ruleLen?.classList.toggle("ok", checks.len)
            ruleUpper?.classList.toggle("ok", checks.upper)
            ruleNum?.classList.toggle("ok", checks.num)
            ruleSpecial?.classList.toggle("ok", checks.special)

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

    /* -------- ✔ PASSWORD MATCH -------- */
    const matchText = document.getElementById("matchText")

    function checkMatch() {
        if (!confirmPass.value) {
            matchText.innerText = ""
            return
        }

        if (newPass.value === confirmPass.value) {
            matchText.innerText = "✔ Passwords match"
            matchText.className = "match ok"
        } else {
            matchText.innerText = "❌ Passwords do not match"
            matchText.className = "match no"
        }
    }

    newPass?.addEventListener("input", checkMatch)
    confirmPass?.addEventListener("input", checkMatch)

    /* -------- 🌊 RIPPLE EFFECT -------- */
    document.addEventListener("click", function (e) {
        const btn = e.target.closest("button")
        if (!btn) return

        const circle = document.createElement("span")
        const diameter = Math.max(btn.clientWidth, btn.clientHeight)

        circle.style.width = circle.style.height = diameter + "px"
        circle.style.left = e.clientX - btn.offsetLeft - diameter / 2 + "px"
        circle.style.top = e.clientY - btn.offsetTop - diameter / 2 + "px"
        circle.classList.add("ripple")

        const ripple = btn.querySelector(".ripple")
        if (ripple) ripple.remove()

        btn.appendChild(circle)
    })

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

    const oldPassEl = document.getElementById("oldPass")
    const newPassEl = document.getElementById("newPass")
    const confirmPassEl = document.getElementById("confirmPass")

    const oldPass = oldPassEl?.value.trim()
    const newPass = newPassEl?.value.trim()
    const confirmPass = confirmPassEl?.value.trim()

        /* clear errors */
        ;[oldPassEl, newPassEl, confirmPassEl].forEach(i => i?.classList.remove("input-error"))

    if (!oldPass || !newPass || !confirmPass) {
        showMessage("⚠ Fill all fields", "error")
        shakeForm()
        return
    }

    const savedPass = localStorage.getItem("password_" + usn) || usn

    if (oldPass !== savedPass) {
        oldPassEl.classList.add("input-error")
        showMessage("❌ Old password incorrect", "error")
        shakeForm()
        return
    }

    if (newPass.length < 4) {
        newPassEl.classList.add("input-error")
        showMessage("⚠ Password too short", "error")
        shakeForm()
        return
    }

    if (newPass !== confirmPass) {
        confirmPassEl.classList.add("input-error")
        showMessage("❌ Passwords do not match", "error")
        shakeForm()
        return
    }

    /* -------- 🔄 LOADING -------- */
    if (btn) {
        btn.classList.add("loading")
        btn.dataset.originalText = btn.innerText
        btn.innerText = ""
    }

    setTimeout(() => {

        localStorage.setItem("password_" + usn, newPass)

        /* -------- 🎉 SUCCESS OVERLAY -------- */
        const overlay = document.getElementById("successOverlay")
        if (overlay) overlay.classList.add("show")

        setTimeout(() => {
            window.location.href = "student-dashboard.html"
        }, 1200)

    }, 800)
}


/* -------- BACK -------- */
function goBack() {
    window.location.href = "student-dashboard.html"
}