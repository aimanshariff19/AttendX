/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__CHANGE_PASS_RUNNING__) {
    throw new Error("Duplicate change password JS blocked")
}
window.__CHANGE_PASS_RUNNING__ = true

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", async () => {
    // Determine which role to check based on the referrer or context
    // Default to student but could be faculty/hod
    const role = localStorage.getItem('user_role') || 'student';
    const user = await requireAuth(role)
    if (!user) return

    console.log("🔥 Change Password Loaded for " + role)

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
    if (newPass) {
        newPass.addEventListener("input", () => {
            let val = newPass.value
            let score = 0
            if (val.length >= 4) score++
            if (/[A-Z]/.test(val)) score++
            if (/[0-9]/.test(val)) score++
            if (/[^A-Za-z0-9]/.test(val)) score++

            const widths = ["0%", "25%", "50%", "75%", "100%"]
            const colors = ["#ef4444", "#f59e0b", "#f59e0b", "#22c55e", "#22c55e"]
            
            if (fill) {
                fill.style.width = widths[score]
                fill.style.background = colors[score]
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
    }, 3000)
}

/* -------- UPDATE PASSWORD -------- */
async function updatePassword() {
    const btn = document.getElementById("updateBtn")
    const oldPassEl = document.getElementById("oldPass")
    const newPassEl = document.getElementById("newPass")
    const confirmPassEl = document.getElementById("confirmPass")

    const oldPass = oldPassEl?.value.trim()
    const newPass = newPassEl?.value.trim()
    const confirmPass = confirmPassEl?.value.trim()

    if (!oldPass || !newPass || !confirmPass) {
        return showMessage("⚠ Please fill all fields", "error")
    }

    if (newPass.length < 4) {
        return showMessage("⚠ Password must be at least 4 characters", "error")
    }

    if (newPass !== confirmPass) {
        return showMessage("❌ Passwords do not match", "error")
    }

    // 🔥 START LOADING
    if (btn) {
        if (!btn.dataset.original) btn.dataset.original = btn.innerHTML
        btn.classList.add("loading")
        btn.innerHTML = `<span>Updating...</span><span class="btn-spinner"></span>`
    }

    try {
        await apiFetch('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
        })

        showMessage("✅ Password updated successfully!", "success")
        
        setTimeout(() => {
            goBack()
        }, 1500)
    } catch (err) {
        console.error(err)
        showMessage(err.body?.msg || "❌ Failed to update password", "error")
        
        // 🛑 STOP LOADING
        if (btn) {
            btn.classList.remove("loading")
            btn.innerHTML = btn.dataset.original
        }
    }
}

/* -------- BACK -------- */
function goBack() {
    const role = localStorage.getItem('user_role') || 'student'
    if (role === 'hod') window.location.href = "hod-dashboard.html"
    else if (role === 'faculty') window.location.href = "dashboard.html"
    else window.location.href = "student-dashboard.html"
}