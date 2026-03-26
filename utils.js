function goBack() {

    localStorage.removeItem("subject")

    window.history.back()

}

/* -------- Logout for Faculty + HOD -------- */

function logout() {

    /* Clear class session */

    localStorage.removeItem("subject")
    localStorage.removeItem("branch")
    localStorage.removeItem("sem")
    localStorage.removeItem("section")
    localStorage.removeItem("classTime")

    /* Clear faculty login */

    localStorage.removeItem("faculty")
    localStorage.removeItem("facultyName")
    localStorage.removeItem("department")

    /* Clear HOD login */

    localStorage.removeItem("hod")
    localStorage.removeItem("hodName")
    localStorage.removeItem("hodDepartment")

    /* Redirect to login page */

    window.location.href = "index.html"

}

/* ---------- Detect current user role ---------- */

function getUserRole() {

    if (localStorage.getItem("studentUSN")) return "student"
    if (localStorage.getItem("faculty")) return "faculty"
    if (localStorage.getItem("hodName")) return "hod"

    return "guest"
}

