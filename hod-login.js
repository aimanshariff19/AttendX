function hodLogin() {

    const username = document.getElementById("username").value
    const password = document.getElementById("password").value

    const hod = hods.find(
        h => h.username === username && h.password === password
    )

    if (!hod) {

        document.getElementById("error").innerText = "Invalid login"
        return

    }

    localStorage.setItem("hodDepartment", hod.department)
    localStorage.setItem("hodName", hod.name)

    window.location.href = "hod-dashboard.html"

}
