// student-login.js

/* -------- RIPPLE EFFECT -------- */
document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const circle = document.createElement("span");
    circle.classList.add("ripple");
    const rect = btn.getBoundingClientRect();
    circle.style.left = (e.clientX - rect.left) + "px";
    circle.style.top = (e.clientY - rect.top) + "px";
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
});

/* -------- THE DATABASE LOGIN -------- */
async function login(e) {
    if (e && e.preventDefault) e.preventDefault();

    const idInput = document.getElementById("studentId");
    const passInput = document.getElementById("password");
    const error = document.getElementById("error");
    const btn = document.getElementById("loginBtn");
    const card = document.querySelector(".login-container");

    if (!idInput || !passInput || !btn) return;

    const id = idInput.value.trim();
    const pass = passInput.value.trim();

    error.innerText = "";

    /* Basic Validation */
    if (!id || !pass) {
        error.innerText = "⚠ Enter Student ID & Password";
        shake();
        return;
    }

    /* Prevent Double Clicks */
    if (btn.classList.contains("loading")) return;

    /* Start Loading UI */
    btn.classList.add("loading");
    const text = btn.querySelector(".btn-text");
    const loader = btn.querySelector(".btn-loader");
    if (text) text.innerText = "Authenticating...";
    if (loader) loader.style.display = "inline-block";

    try {
        // 🚀 CALL SUPABASE
        const { data, error: dbError } = await window.db.rpc('verify_student_login', {
            p_username: id,
            p_password: pass
        });

        if (dbError) throw dbError;

        // Check if array is empty (Invalid Login)
        if (!data || data.length === 0) {
            error.innerText = "❌ Invalid Student ID or Password";
            shake();
            resetBtn();
            return;
        }

        /* SUCCESS! SAVE TO BROWSER MEMORY */
        const student = data[0];
        student.role = 'student'; // Tag them so the dashboard knows who they are

        // Clear any old faculty logins and save the new student session
        localStorage.clear();
        localStorage.setItem("attendx_student", JSON.stringify(student));

        console.log("✅ Login success", student);

        /* Redirect to Dashboard */
        setTimeout(() => {
            window.location.href = "student-dashboard.html";
        }, 400);

    } catch (err) {
        console.error("Login Error:", err);
        error.innerText = "❌ Connection failed. Try again.";
        shake();
        resetBtn();
    }

    /* UI Helpers */
    function resetBtn() {
        btn.classList.remove("loading");
        if (text) text.innerText = "Login";
        if (loader) loader.style.display = "none";
    }

    function shake() {
        if (!card) return;
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 400);
    }
}

/* -------- FOOLPROOF PASSWORD TOGGLE -------- */
function togglePassword() {
    const passwordField = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

/* -------- KEYBOARD SUPPORT (ENTER KEY) -------- */
window.addEventListener("load", () => {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && document.activeElement.tagName === "INPUT") {
            login(e);
        }
    });
});