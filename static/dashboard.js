/* -------- SAFE TEXT HELPER -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value || "-";
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

/* -------- BUTTON LOADING HELPER -------- */
function setBtnLoading(btn, textValue) {
    if (!btn) return;
    if (!btn.dataset.original) btn.dataset.original = btn.innerHTML;
    
    btn.classList.add("loading");
    let text = btn.querySelector("span");
    if (text) text.innerText = textValue;
    else btn.innerHTML = `<span>${textValue}</span>`;

    let old = btn.querySelector(".btn-spinner");
    if (old) old.remove();

    let spinner = document.createElement("span");
    spinner.className = "btn-spinner";
    btn.appendChild(spinner);
}

/* -------- 🚀 PHASE 1: LOAD FACULTY DETAILS -------- */
function loadFacultyDetails() {
    // Inject the data that Python securely handed to us!
    setText("facultyName", faculty.name);
    
    // We can show the first 8 characters of their secure ID
    setText("facultyId", faculty.id.substring(0, 8)); 
    
    setText("facultyDept", `<span style="opacity:0.8;">Status:</span> Logged In`);
    
    // Use the real Python calculations instead of placeholders!
    setText("sectionCount", sectionCount);
    setText("studentCount", studentCount);
}

/* -------- 🚀 PHASE 2: LOAD COURSE CARDS -------- */
function loadCourseCards() {
    const container = document.getElementById("courseCards");
    if (!container) return;

    // Handle empty states (No classes assigned)
    if (!rawSubjects || rawSubjects.length === 0) {
        container.innerHTML = "<p style='opacity:0.7;'>No courses assigned</p>";
        setText("courseCount", "0");
        return;
    }

    // Update the Dashboard "Courses" Stat Counter
    setText("courseCount", rawSubjects.length.toString());

    // Generate the HTML Cards dynamically
    container.innerHTML = "";

    rawSubjects.forEach((course, index) => {
        const card = document.createElement("div");
        card.className = "subject-card";
        
        // We add two buttons now: Take Attendance and Edit
        card.innerHTML = `
            <h4>${course.name}</h4>
            <p>Code: ${course.code}</p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button style="flex: 1;" onclick="openCourse('${course.name}', '${course.id}', '/attendance')">
                    <span>Take Attendance</span>
                </button>
                <button style="flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);" onclick="openCourse('${course.name}', '${course.id}', '/edit-attendance')">
                    <span>Edit</span>
                </button>
            </div>
        `;

        // Add the staggered fade-in animation
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

/* -------- OPEN COURSE (Passing Data to the next page) -------- */
function openCourse(subjectName, subjectId, pythonRoute) {
    document.querySelector(".dashboard").classList.add("page-exit");

    setTimeout(() => {
        // We still use localStorage here just to pass the ID to the NEXT page so it knows what to load!
        localStorage.setItem("current_subject_id", subjectId);
        localStorage.setItem("current_subject_name", subjectName);

        // Send them to the secure Python route!
        window.location.href = pythonRoute;
    }, 400);
}

/* -------- TEMPORARY STUB FOR TODAY'S SCHEDULE -------- */
function loadTodaySchedule() {
    const box = document.getElementById("todaySchedule");
    if (box) box.innerHTML = "<p style='opacity:0.7;'>Schedule feature coming soon...</p>";
}

/* -------- LOGOUT -------- */
function logout(btn) {
    if (!btn) btn = document.querySelector(".logout-btn");
    setBtnLoading(btn, "Logging out...");

    setTimeout(() => {
        document.querySelector(".dashboard").classList.add("page-exit");
        
        setTimeout(() => {
            // Route via Python!
            window.location.href = "/logout";
        }, 400);
    }, 800);
}

/* -------- INIT ON PAGE LOAD -------- */
document.addEventListener("DOMContentLoaded", () => {
    // Fetch and render the data immediately
    loadFacultyDetails();
    loadTodaySchedule();
    loadCourseCards();
});

/* FIX STUCK SPINNER WHEN RETURNING FROM BACK */
window.addEventListener("pageshow", function () {
    document.querySelectorAll(".loading").forEach(btn => {
        btn.classList.remove("loading");
        if (btn.dataset.original) {
            btn.innerHTML = btn.dataset.original;
        }
    });
});