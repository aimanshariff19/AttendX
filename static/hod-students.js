let allStudentsData = []; 

/* -------- 🚀 CALCULATE DATA -------- */
function loadDepartmentStudents() {
    const tableBody = document.getElementById("studentTableBody");
    if (!tableBody) return;

    if (!rawStudentsData) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444;">Failed to load data.</td></tr>`;
        return;
    }

    // Process data to calculate percentages
    allStudentsData = rawStudentsData.map(student => {
        const records = student.attendance_records || [];
        const totalClasses = records.length;
        const presentCount = records.filter(r => r.status === 'Present').length;
        const percentage = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);

        return {
            ...student,
            totalClasses,
            presentCount,
            percentage
        };
    });

    renderTable(allStudentsData);
}

/* -------- 📊 RENDER TABLE -------- */
function renderTable(dataToRender) {
    const tableBody = document.getElementById("studentTableBody");
    tableBody.innerHTML = "";

    if (dataToRender.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; opacity:0.7;">No students found matching criteria.</td></tr>`;
        return;
    }

    dataToRender.forEach((student, index) => {
        const tr = document.createElement("tr");

        let badgeClass = "none";
        let badgeText = "No Data";

        if (student.totalClasses > 0) {
            if (student.percentage >= 85) { badgeClass = "good"; badgeText = "Excellent"; }
            else if (student.percentage >= 75) { badgeClass = "warning"; badgeText = "Warning"; }
            else { badgeClass = "danger"; badgeText = "Critical"; }
        }

        tr.innerHTML = `
            <td style="font-weight: 600;">${student.usn}</td>
            <td>${student.name}</td>
            <td>Sem ${student.current_semester}</td>
            <td>${student.totalClasses}</td>
            <td>${student.presentCount}</td>
            <td style="font-weight: 700; color: ${badgeClass === 'danger' ? '#f87171' : 'white'}">${student.percentage}%</td>
            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        `;

        tr.style.opacity = "0";
        tr.style.transform = "translateY(10px)";
        setTimeout(() => {
            tr.style.transition = "0.3s ease";
            tr.style.opacity = "1";
            tr.style.transform = "translateY(0)";
        }, index * 30);

        tableBody.appendChild(tr);
    });
}

/* -------- 🔍 SEARCH FUNCTIONALITY -------- */
document.getElementById("searchInput")?.addEventListener("input", function(e) {
    const query = e.target.value.toLowerCase().trim();
    
    const filteredStudents = allStudentsData.filter(student => 
        student.usn.toLowerCase().includes(query) || 
        student.name.toLowerCase().includes(query)
    );

    renderTable(filteredStudents);
});

/* -------- INIT -------- */
document.addEventListener("DOMContentLoaded", () => {
    loadDepartmentStudents();
});