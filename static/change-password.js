/* -------- 🛑 STOP DUPLICATE -------- */
if (window.__CHANGE_PASS_RUNNING__) {
    throw new Error("Duplicate change password JS blocked");
}
window.__CHANGE_PASS_RUNNING__ = true;

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {
    const updateBtn = document.getElementById("updateBtn");
    const backBtn = document.getElementById("backBtn");

    if (updateBtn) updateBtn.addEventListener("click", updatePassword);
    if (backBtn) backBtn.addEventListener("click", goBack);

    const newPass = document.getElementById("newPass");
    const confirmPass = document.getElementById("confirmPass");

    /* 👁 TOGGLE PASSWORD */
    function toggleEye(inputId, eyeId) {
        const input = document.getElementById(inputId);
        const eye = document.getElementById(eyeId);
        if (!input || !eye) return;

        eye.addEventListener("click", () => {
            input.type = input.type === "password" ? "text" : "password";
        });
    }

    toggleEye("newPass", "eyeNew");
    toggleEye("confirmPass", "eyeConfirm");

    /* 📊 PASSWORD STRENGTH */
    const fill = document.getElementById("strengthFill");
    const ruleLen = document.getElementById("ruleLen");
    const ruleUpper = document.getElementById("ruleUpper");
    const ruleNum = document.getElementById("ruleNum");
    const ruleSpecial = document.getElementById("ruleSpecial");

    if (newPass) {
        newPass.addEventListener("input", () => {
            let val = newPass.value;
            let score = 0;

            const checks = {
                len: val.length >= 4,
                upper: /[A-Z]/.test(val),
                num: /[0-9]/.test(val),
                special: /[^A-Za-z0-9]/.test(val)
            };

            if (checks.len) score++;
            if (checks.upper) score++;
            if (checks.num) score++;
            if (checks.special) score++;

            /* -------- RULES UPDATE -------- */
            ruleLen?.classList.toggle("ok", checks.len);
            ruleUpper?.classList.toggle("ok", checks.upper);
            ruleNum?.classList.toggle("ok", checks.num);
            ruleSpecial?.classList.toggle("ok", checks.special);

            const widths = ["0%", "25%", "50%", "75%", "100%"];
            if (fill) fill.style.width = widths[score];

            if (!fill) return;

            if (score <= 1) {
                fill.style.background = "#ef4444";
            } else if (score === 2) {
                fill.style.background = "#f59e0b";
            } else {
                fill.style.background = "#22c55e";
            }
        });
    }

    /* -------- ✔ PASSWORD MATCH -------- */
    const matchText = document.getElementById("matchText");

    function checkMatch() {
        if (!confirmPass.value) {
            matchText.innerText = "";
            return;
        }

        if (newPass.value === confirmPass.value) {
            matchText.innerText = "✔ Passwords match";
            matchText.className = "match ok";
            matchText.style.color = "#22c55e";
        } else {
            matchText.innerText = "❌ Passwords do not match";
            matchText.className = "match no";
            matchText.style.color = "#ef4444";
        }
    }

    newPass?.addEventListener("input", checkMatch);
    confirmPass?.addEventListener("input", checkMatch);

    /* -------- 🌊 RIPPLE EFFECT -------- */
    document.addEventListener("click", function (e) {
        const btn = e.target.closest("button");
        if (!btn) return;
        const circle = document.createElement("span");
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        circle.style.width = circle.style.height = diameter + "px";
        circle.style.left = e.clientX - btn.offsetLeft - diameter / 2 + "px";
        circle.style.top = e.clientY - btn.offsetTop - diameter / 2 + "px";
        circle.classList.add("ripple");
        const ripple = btn.querySelector(".ripple");
        if (ripple) ripple.remove();
        btn.appendChild(circle);
    });
});

/* -------- MESSAGE HELPER -------- */
function showMessage(text, type) {
    let box = document.getElementById("messageBox");
    if (!box) {
        box = document.createElement("div");
        box.id = "messageBox";
        box.className = "message-box";
        box.style.padding = "10px";
        box.style.borderRadius = "8px";
        box.style.marginBottom = "15px";
        box.style.textAlign = "center";
        document.querySelector(".card").prepend(box);
    }

    box.style.background = type === "error" ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)";
    box.style.color = type === "error" ? "#ef4444" : "#22c55e";
    box.style.border = type === "error" ? "1px solid #ef4444" : "1px solid #22c55e";
    
    box.innerText = text;
    box.style.display = "block";

    setTimeout(() => { box.style.display = "none"; }, 3000);
}

/* -------- SHAKE -------- */
function shakeForm() {
    const card = document.querySelector(".card");
    if (!card) return;
    card.classList.add("shake");
    setTimeout(() => { card.classList.remove("shake"); }, 400);
}

/* -------- 🚀 THE PYTHON API UPDATE -------- */
async function updatePassword() {
    const btn = document.getElementById("updateBtn");
    const oldPassEl = document.getElementById("oldPass");
    const newPassEl = document.getElementById("newPass");
    const confirmPassEl = document.getElementById("confirmPass");

    const oldPass = oldPassEl?.value.trim();
    const newPass = newPassEl?.value.trim();
    const confirmPass = confirmPassEl?.value.trim();

    /* Clear previous red borders */
    [oldPassEl, newPassEl, confirmPassEl].forEach(i => i?.classList.remove("input-error"));

    /* Basic Validation */
    if (!oldPass || !newPass || !confirmPass) {
        showMessage("⚠ Please fill all fields", "error");
        shakeForm();
        return;
    }

    if (newPass.length < 4) {
        newPassEl.classList.add("input-error");
        showMessage("⚠ Password must be at least 4 characters", "error");
        shakeForm();
        return;
    }

    if (newPass !== confirmPass) {
        confirmPassEl.classList.add("input-error");
        showMessage("❌ New passwords do not match", "error");
        shakeForm();
        return;
    }

    /* Set Loading State */
    if (btn) {
        btn.classList.add("loading");
        btn.dataset.originalText = btn.innerHTML;
    }

    try {
        // 🔥 SEND DATA TO PYTHON INSTEAD OF SUPABASE
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                oldPass: oldPass, 
                newPass: newPass 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            oldPassEl.classList.add("input-error");
            showMessage(`❌ ${result.error}`, "error");
            shakeForm();
            resetButton(btn);
            return;
        }

        /* 🎉 SUCCESS OVERLAY */
        const overlay = document.getElementById("successOverlay");
        if (overlay) overlay.classList.add("show");

        setTimeout(() => {
            // Route via Python!
            window.location.href = "/student-dashboard";
        }, 1500);

    } catch (err) {
        console.error("Password Update Error:", err);
        showMessage("❌ Server error. Try again later.", "error");
        resetButton(btn);
    }
}

function resetButton(btn) {
    if (btn) {
        btn.classList.remove("loading");
        if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    }
}

/* -------- BACK -------- */
function goBack() {
    // Route via Python!
    window.location.href = "/student-dashboard";
}