function studentLogin() {

    const studentId = document.getElementById("studentId").value.trim()
    const password = document.getElementById("password").value.trim()
    const error = document.getElementById("error")

    error.innerText = ""

    // 🔹 Validation
    if (!studentId || !password) {
        error.innerText = "Please fill all fields"
        return
    }

    let foundStudent = null
    let studentClassKey = null

    // 🔥 LOOP THROUGH ALL GROUPS
    for (let key in students) {

        const group = students[key]

        const match = group.find(s =>
            s.usn === studentId && s.password === password
        )

        if (match) {
            foundStudent = match
            studentClassKey = key

            // OPTIONAL (for other features)
            const [department, program, sem, section] = key.split("_")

            localStorage.setItem("branch", program)
            localStorage.setItem("sem", sem)
            localStorage.setItem("section", section)

            break
        }
    }

    // 🔥 SUCCESS LOGIN
    if (foundStudent) {

        localStorage.setItem("role", "student")

        // ✅ MATCHING DASHBOARD KEYS
        localStorage.setItem("studentUSN", foundStudent.usn)
        localStorage.setItem("studentName", foundStudent.name)
        localStorage.setItem("studentClass", studentClassKey)

        window.location.href = "student-dashboard.html"

    } else {
        error.innerText = "Invalid Student ID or Password"
    }
}


// 👁️ PASSWORD TOGGLE (SAFE)
document.addEventListener("DOMContentLoaded", () => {

    const eyeIcon = document.getElementById("eyeIcon")
    const passwordInput = document.getElementById("password")

    if (!eyeIcon || !passwordInput) return

    eyeIcon.addEventListener("click", () => {

        const isPassword = passwordInput.type === "password"

        passwordInput.type = isPassword ? "text" : "password"

        eyeIcon.classList.toggle("fa-eye")
        eyeIcon.classList.toggle("fa-eye-slash")

    })

})