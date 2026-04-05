/* -------- UI HELPERS -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value || "0";
}

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

/* -------- 🚀 LOAD GOD-MODE DATA -------- */
function loadHodDashboard() {
    // 1. Profile
    setText("hodName", `Dr. ${hodName}`); 
    setText("hodDept", `<span style="opacity:0.8">Head of</span> ${deptName}`);

    // 2. Stats
    setText("totalFaculty", stats.faculty);
    setText("totalStudents", stats.students);
    setText("totalCourses", stats.courses);
    setText("totalSections", stats.sections); 

    // 3. Activity
    loadDepartmentActivity();
}

/* -------- 🚀 LOAD DEPARTMENT ACTIVITY -------- */
function loadDepartmentActivity() {
    const container = document.getElementById("courseCards");
    if (!container) return;

    container.innerHTML = "";

    if (!recentActivity || recentActivity.length === 0) {
        container.innerHTML = "<p style='opacity:0.7;'>No recent activity in this department.</p>";
        return;
    }

    const title = document.createElement("h3");
    title.innerText = "Recent Department Classes";
    title.style.marginBottom = "15px";
    title.style.width = "100%";
    container.appendChild(title);

    recentActivity.forEach((session, index) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.padding = "16px";
        card.style.marginBottom = "10px";

        const dateObj = new Date(session.session_date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="margin-bottom: 4px; font-size: 16px;">${session.subjects.name}</h4>
                    <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">${session.subjects.code} • Prof. ${session.faculty.name}</p>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 11px; background: rgba(99, 102, 241, 0.2); color: #c7d2fe; padding: 4px 8px; border-radius: 6px;">
                        ${formattedDate}
                    </span>
                </div>
            </div>
        `;

        card.style.opacity = "0";
        card.style.transform = "translateY(15px)";
        setTimeout(() => {
            card.style.transition = "0.4s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, index * 100);

        container.appendChild(card);
    });
}

/* -------- LOGOUT -------- */
function logout() {
    document.querySelector(".dashboard").style.opacity = "0";
    setTimeout(() => {
        window.location.href = "/logout";
    }, 400);
}

document.addEventListener("DOMContentLoaded", () => {
    loadHodDashboard();
});