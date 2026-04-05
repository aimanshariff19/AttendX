/* -------- 🛑 STOP DUPLICATE -------- */
if (window.DASHBOARD_RUNNING) {
    throw new Error("Duplicate dashboard JS blocked");
}
window.DASHBOARD_RUNNING = true;

/* -------- UI HELPERS -------- */
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value || "-";
}

function setBtnLoading(btn, text = "Loading...") {
    if (!btn) return;
    if (!btn.dataset.original) {
        btn.dataset.original = btn.innerHTML;
    }
    btn.classList.add("loading");
    btn.innerHTML = `<span>${text}</span>`;
}

function resetBtn(btn) {
    if (!btn) return;
    btn.classList.remove("loading");
    if (btn.dataset.original) {
        btn.innerHTML = btn.dataset.original;
    }
}

/* -------- RIPPLE EFFECT -------- */
document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.querySelector(".ripple")) return;

    const circle = document.createElement("span");
    circle.classList.add("ripple");
    const rect = btn.getBoundingClientRect();
    circle.style.left = (e.clientX - rect.left) + "px";
    circle.style.top = (e.clientY - rect.top) + "px";

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
});

/* -------- PREDICTION ENGINE -------- */
function predictAttendance(present, total, target = 75) {
    if (total === 0) return 0; // Avoid infinite loops on empty classes
    let needed = 0;
    while (true) {
        let percent = ((present + needed) / (total + needed)) * 100;
        if (percent >= target) return needed;
        needed++;
        // Safety break
        if (needed > 200) return ">200"; 
    }
}

/* -------- 🚀 PHASE 5: FETCH DASHBOARD DATA -------- */
async function loadDashboardData() {
    const table = document.getElementById("subjectRows");
    if (!table) return;

    try {
        // 1. Inject Student Profile Info (Data comes from Python now!)
        setText("studentUSN", student.usn);
        setText("studentName", student.name);
        setText("department", deptName);
        setText("sem", student.current_semester);
        
        // Hide unused stub fields 
        document.getElementById("program").parentElement.style.display = "none";
        document.getElementById("section").parentElement.style.display = "none";

        // 2. Process the raw data from Python into subject-specific statistics
        const subjectStats = {};

        if (rawAttendanceData && rawAttendanceData.length > 0) {
            rawAttendanceData.forEach(record => {
                const session = record.class_sessions;
                if (!session || !session.subjects) return; // Skip broken records
                
                const subjectId = session.subject_id;
                const subjectName = session.subjects.name;
                const subjectCode = session.subjects.code;

                if (!subjectStats[subjectId]) {
                    subjectStats[subjectId] = {
                        name: subjectName,
                        code: subjectCode,
                        total: 0,
                        present: 0
                    };
                }

                subjectStats[subjectId].total += 1;
                if (record.status === 'Present') {
                    subjectStats[subjectId].present += 1;
                }
            });
        }

        // 3. Render the Table
        table.innerHTML = "";
        let totalPercentSum = 0;
        let subjectsCount = 0;

        if (Object.keys(subjectStats).length === 0) {
            table.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No attendance records found yet.</td></tr>`;
            updateOverallBox(0);
            return;
        }

        Object.values(subjectStats).forEach((stats, index) => {
            const absent = stats.total - stats.present;
            const percent = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
            
            totalPercentSum += percent;
            subjectsCount++;

            const needed = predictAttendance(stats.present, stats.total);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${stats.name}</td>
                <td>${stats.code || "-"}</td>
                <td>${stats.total}</td>
                <td>${stats.present}</td>
                <td>${absent}</td>
                <td>
                    <div class="circle ${percent < 75 ? "low" : ""}"
                        style="--percent:${percent * 3.6}deg"
                        data-text="${percent}%">
                    </div>
                    <div class="bar ${percent < 75 ? "low-bar" : ""}">
                        <div class="fill" style="width:${percent}%"></div>
                    </div>
                    <div style="font-size:11px;margin-top:6px;color:${percent < 75 ? "#ef4444" : "#aaa"}">
                        ${percent < 75 ? `Need ${needed} more classes` : "On track"}
                    </div>
                </td>
            `;

            row.style.opacity = "0";
            row.style.transform = "translateY(10px)";

            setTimeout(() => {
                row.style.transition = "0.3s ease";
                row.style.opacity = "1";
                row.style.transform = "translateY(0)";
            }, index * 80);

            table.appendChild(row);
        });

        // 4. Calculate and Render Overall Attendance
        const overall = subjectsCount > 0 ? Math.round(totalPercentSum / subjectsCount) : 0;
        updateOverallBox(overall);

    } catch (err) {
        console.error("Dashboard Load Error:", err);
        table.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ef4444;">Failed to load data.</td></tr>`;
    }
}

function updateOverallBox(overall) {
    let overallBox = document.getElementById("overallBox");

    if (!overallBox) {
        overallBox = document.createElement("div");
        overallBox.id = "overallBox";
        overallBox.className = "card";
        document.querySelector(".dashboard").prepend(overallBox);
    }

    overallBox.innerHTML = `
        <p><strong>Overall Attendance:</strong> ${overall}%</p>
        <div class="bar ${overall < 75 ? "low-bar" : ""}">
            <div class="fill" style="width:${overall}%"></div>
        </div>
        <p style="margin-top:8px;font-weight:600;color:${overall < 75 ? "#ef4444" : overall < 85 ? "#f59e0b" : "#22c55e"}">
            ${overall < 75 ? "⚠ Low Attendance" : overall < 85 ? "⚠ Average" : "✅ Excellent"}
        </p>
    `;
}

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {
    // Start data fetch
    loadDashboardData();

    /* 🔥 BUTTON EVENTS */
    document.getElementById("changePasswordBtn")?.addEventListener("click", function () {
        setBtnLoading(this, "Opening...");
        setTimeout(() => openChangePassword(), 300);
    });

    document.getElementById("logoutBtn")?.addEventListener("click", function () {
        setBtnLoading(this, "Logging out...");
        studentLogout();
    });
});

/* -------- NAV -------- */
function openChangePassword() {
    window.location.href = "/change-password";
}

/* -------- LOGOUT -------- */
function studentLogout() {
    document.querySelector(".dashboard").style.opacity = "0";
    document.querySelector(".dashboard").style.transform = "scale(0.95)";

    setTimeout(() => {
        // Send them to the Python backend to securely destroy the cookie!
        window.location.href = "/logout";
    }, 400);
}

/* -------- 🔥 FIX BACK BUTTON -------- */
window.addEventListener("pageshow", () => {
    document.querySelectorAll("button.loading").forEach(btn => {
        resetBtn(btn);
    });
});
