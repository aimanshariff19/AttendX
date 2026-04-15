/* -------- UI HELPERS -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value || "0";
}

/* -------- RIPPLE + SPINNER -------- */
document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    // Ripple
    const circle = document.createElement("span");
    circle.classList.add("ripple");

    const rect = btn.getBoundingClientRect();
    circle.style.left = (e.clientX - rect.left) + "px";
    circle.style.top = (e.clientY - rect.top) + "px";

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);

    // Spinner
    if (!btn.classList.contains("loading")) {
        btn.classList.add("loading");

        const spinner = document.createElement("span");
        spinner.className = "btn-spinner";
        btn.appendChild(spinner);

        setTimeout(() => {
            btn.classList.remove("loading");
            spinner.remove();
        }, 600);
    }
});

/* -------- SAFE DATA (FROM FLASK) -------- */
// 🔥 IMPORTANT: this comes from HTML
// const allSubjects = {{ subjects | tojson | safe }};

if (typeof allSubjects === "undefined") {
    console.warn("⚠ allSubjects not found from backend");
    window.allSubjects = []; // fallback to avoid crash
}

/* -------- LOAD DASHBOARD -------- */
function loadHodDashboard() {
    // Profile
    setText("hodName", `Dr. ${hodName || ""}`);
    setText("hodDept", `<span style="opacity:0.8">Head of</span> ${deptName || ""}`);

    // Stats
    setText("totalFaculty", stats?.faculty);
    setText("totalStudents", stats?.students);
    setText("totalCourses", stats?.courses);
    setText("totalSections", stats?.sections);

    // Load subjects
    loadSubjects();
}

/* -------- LOAD SUBJECTS -------- */
function loadSubjects() {
    const container = document.getElementById("courseCards");
    if (!container) return;

    container.innerHTML = "";

    if (!window.allSubjects || window.allSubjects.length === 0) {
        container.innerHTML = "<p style='opacity:0.7;'>No subjects found.</p>";
        return;
    }

    window.allSubjects.forEach((sub) => {
        const card = document.createElement("div");
        card.className = "subject-card";

        card.innerHTML = `
            <h3>${sub.name || sub.subject_name || "N/A"}</h3>
            <p>${sub.code || sub.subject_code || ""}</p>
            <p>Sem ${sub.sem || ""} • Sec ${sub.section || ""}</p>
            <p style="margin-bottom:10px;">Prof. ${sub.faculty || sub.faculty_name || ""}</p>

            <button onclick="openSubject('${sub.id}')">
                View
            </button>
        `;

        container.appendChild(card);
    });
}

/* -------- FILTER LOGIC -------- */
function applyFilters() {
    const dept = document.getElementById("filterDept").value;
    const program = document.getElementById("filterProgram").value;
    const sem = document.getElementById("filterSem").value;
    const section = document.getElementById("filterSection").value;

    const filtered = window.allSubjects.filter(sub => {
        return (
            (!dept || sub.dept == dept) &&
            (!program || sub.program == program) &&
            (!sem || sub.sem == sem) &&
            (!section || sub.section == section)
        );
    });

    renderFilteredSubjects(filtered);
}

/* -------- RENDER FILTERED -------- */
function renderFilteredSubjects(list) {
    const container = document.getElementById("courseCards");
    container.innerHTML = "";

    if (!list || list.length === 0) {
        container.innerHTML = "<p style='opacity:0.7;'>No matching subjects.</p>";
        return;
    }

    list.forEach((sub) => {
        const card = document.createElement("div");
        card.className = "subject-card";

        card.innerHTML = `
            <h3>${sub.name || sub.subject_name || "N/A"}</h3>
            <p>${sub.code || sub.subject_code || ""}</p>
            <p>Sem ${sub.sem || ""} • Sec ${sub.section || ""}</p>
            <p style="margin-bottom:10px;">Prof. ${sub.faculty || sub.faculty_name || ""}</p>

            <button onclick="openSubject('${sub.id}')">
                View
            </button>
        `;

        container.appendChild(card);
    });
}

/* -------- OPEN SUBJECT -------- */
function openSubject(id) {
    localStorage.setItem("current_subject_id", id);
    window.location.href = "/faculty-subject";
}

/* -------- LOGOUT -------- */
function logout() {
    document.querySelector(".dashboard").style.opacity = "0";
    setTimeout(() => {
        window.location.href = "/logout";
    }, 400);
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {
    loadHodDashboard();
});