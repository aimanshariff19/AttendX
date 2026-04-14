/* -------- SAFE TEXT HELPER -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value ?? "-";
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

/* -------- BUTTON LOADING -------- */
function setBtnLoading(btn, textValue) {
    if (!btn) return;

    if (!btn.dataset.original) {
        btn.dataset.original = btn.innerHTML;
    }

    btn.classList.add("loading");

    let text = btn.querySelector("span");
    if (text) {
        text.innerText = textValue;
    } else {
        btn.innerHTML = `<span>${textValue}</span>`;
    }

    let old = btn.querySelector(".btn-spinner");
    if (old) old.remove();

    let spinner = document.createElement("span");
    spinner.className = "btn-spinner";
    btn.appendChild(spinner);
}

/* -------- LOAD FACULTY DETAILS -------- */
function loadFacultyDetails() {
    console.log("🔥 Faculty Data:", faculty);

    if (!faculty || typeof faculty !== "object") {
        console.error("❌ Faculty data missing or invalid");
        return;
    }

    setText("facultyName", faculty.name || "Unknown");

    setText(
        "facultyId",
        faculty.id ? faculty.id.toString().substring(0, 8) : "N/A"
    );

    setText(
        "facultyDept",
        `<span style="opacity:0.8;">Status:</span> Logged In`
    );

    setText("sectionCount", sectionCount ?? 0);
    setText("studentCount", studentCount ?? 0);
}

/* -------- LOAD COURSE CARDS -------- */
function loadCourseCards() {
    console.log("📚 Subjects:", rawSubjects);

    const container = document.getElementById("courseCards");
    if (!container) return;

    if (!Array.isArray(rawSubjects) || rawSubjects.length === 0) {
        container.innerHTML = "<p style='opacity:0.7;'>No courses assigned</p>";
        setText("courseCount", "0");
        return;
    }

    setText("courseCount", rawSubjects.length);

    container.innerHTML = "";

    rawSubjects.forEach((course, index) => {
        console.log("➡️ Course:", course);

        // SAFE DATA EXTRACTION
        const name = course.name || course.subject_name || "Unknown";
        const id = course.id || course.subject_id || "0";
        const code = course.code || course.subject_code || "N/A";

        const card = document.createElement("div");
        card.className = "subject-card";

        card.innerHTML = `
    <h4>${name}</h4>
    <p>Code: ${code}</p>

    <button onclick="openCourse('${name}', '${id}', '/attendance')">
        <span>Take Attendance</span>
    </button>
`;

        // Animation
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(() => {
            card.style.transition = "0.4s ease";
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }, index * 120);

        container.appendChild(card);
    });
}

/* -------- OPEN COURSE -------- */
function openCourse(subjectName, subjectId, route, btn) {
    console.log("🚀 Opening:", subjectName, subjectId);
    setBtnLoading(btn, "Opening...");

    document.querySelector(".dashboard")?.classList.add("page-exit");

    setTimeout(() => {
        localStorage.setItem("current_subject_id", subjectId);
        localStorage.setItem("current_subject_name", subjectName);

        window.location.href = route;
    }, 400);
}

/* -------- TODAY SCHEDULE -------- */
function loadTodaySchedule() {
    const box = document.getElementById("todaySchedule");
    if (box) {
        box.innerHTML = "<p style='opacity:0.7;'>Schedule feature coming soon...</p>";
    }
}

/* -------- LOGOUT -------- */
function logout(btn) {
    if (!btn) btn = document.querySelector(".logout-btn");

    setBtnLoading(btn, "Logging out...");

    setTimeout(() => {
        document.querySelector(".dashboard")?.classList.add("page-exit");

        setTimeout(() => {
            window.location.href = "/logout";
        }, 400);
    }, 800);
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {
    try {
        loadFacultyDetails();
        loadTodaySchedule();
        loadCourseCards();
    } catch (err) {
        console.error("🔥 Dashboard crash:", err);
    }
});

/* -------- FIX BACK BUTTON SPINNER -------- */
window.addEventListener("pageshow", function () {
    document.querySelectorAll(".loading").forEach(btn => {
        btn.classList.remove("loading");
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original;
        }
    });
});