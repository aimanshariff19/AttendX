let adminUser = null;
let courses = [];
let faceStream = null;
let capturedPhoto = "";
let capturedSignature = "";

const programsByDepartment = {
  CSE: ["CSE", "CSD", "AIML"],
  ECE: ["ECE"],
  ME: ["ME"],
  CIVIL: ["CIVIL"],
  ISE: ["ISE", "CSDS"],
};

const departmentOrder = ["CSE", "ECE", "ME", "CIVIL", "ISE"];

function setStatus(message) {
  document.getElementById("status").innerText = message;
}

function value(id) {
  return document.getElementById(id).value.trim();
}

function captureSignatureFromVideo() {
  const video = document.getElementById("faceVideo");
  if (!video.videoWidth || !video.videoHeight)
    throw new Error("Start the camera first");

  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 16, 16);
  const data = ctx.getImageData(0, 0, 16, 16).data;
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(Math.round((data[i] + data[i + 1] + data[i + 2]) / 3));
  }
  const average = gray.reduce((sum, item) => sum + item, 0) / gray.length;
  return gray.map((item) => (item >= average ? "1" : "0")).join("");
}

function photoFromVideo() {
  const video = document.getElementById("faceVideo");
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function startCamera() {
  try {
    const video = document.getElementById("faceVideo");
    if (!faceStream) {
      faceStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
    }
    video.srcObject = faceStream;
    await video.play();
    setStatus("Camera ready. Capture the student face before saving.");
  } catch (err) {
    setStatus("Camera permission is required.");
  }
}

function captureFace() {
  try {
    capturedSignature = captureSignatureFromVideo();
    capturedPhoto = photoFromVideo();
    document.getElementById("photoPreview").src = capturedPhoto;
    setStatus("Face captured. Save the student to store details.");
  } catch (err) {
    setStatus(err.message || "Could not capture face.");
  }
}

async function loadCourses() {
  courses = await apiFetch("/admin/courses");
  const select = document.getElementById("courseSelect");
  courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.innerText = `${course.subject} - ${course.program} Sem ${course.sem} Sec ${course.section}`;
    select.appendChild(option);
  });
}

function fillCourse(courseId) {
  const course = courses.find((item) => String(item.id) === String(courseId));
  if (!course) return;
  document.getElementById("department").value = course.department || "";
  populateProgramOptions(course.department || "", course.program || "");
  document.getElementById("sem").value = course.sem || "";
  document.getElementById("section").value = course.section || "";
  loadStudents();
}

async function loadStudents() {
  const selected = {
    department: value("department"),
    program: value("program"),
    sem: value("sem"),
    section: value("section"),
  };
  const students = await apiFetch("/admin/students");
  renderStudentTables(students, selected);
}

async function saveStudent(event) {
  event.preventDefault();
  const payload = {
    usn: value("usn"),
    name: value("name"),
    phone: value("phone"),
    parentPhone: value("parentPhone"),
    email: value("email"),
    department: value("department"),
    program: value("program"),
    sem: value("sem"),
    section: value("section"),
    password: value("password"),
    photo: capturedPhoto,
    faceSignature: capturedSignature,
  };

  if (
    !payload.department ||
    !payload.program ||
    !payload.sem ||
    !payload.section
  ) {
    setStatus("Select branch, program, semester and section before saving.");
    return;
  }

  const student = await apiFetch("/admin/students", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 12000,
  });

  setStatus(
    `${student.id} saved for ${student.program} Sem ${student.sem} Sec ${student.section}.`,
  );
  clearStudentInputs();
  capturedPhoto = "";
  capturedSignature = "";
  document.getElementById("photoPreview").removeAttribute("src");
  await loadStudents();
}

function clearStudentInputs() {
  ["usn", "name", "phone", "parentPhone", "email", "password"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("courseSelect").value = "";
}

async function fetchStudentByUsn() {
  const usn = value("usn").toUpperCase();
  if (!usn) return;

  try {
    const student = await apiFetch(
      `/admin/students/${encodeURIComponent(usn)}`,
    );
    document.getElementById("usn").value = student.id || usn;
    document.getElementById("name").value = student.name || "";
    document.getElementById("phone").value = student.phone || "";
    document.getElementById("parentPhone").value = student.parentPhone || "";
    document.getElementById("email").value = student.email || "";
    document.getElementById("department").value = student.department || "";
    populateProgramOptions(student.department || "", student.program || "");
    document.getElementById("sem").value = student.sem || "";
    document.getElementById("section").value = student.section || "";
    capturedPhoto = student.photo || student.facePhoto || "";
    capturedSignature = student.faceSignature || "";
    if (capturedPhoto)
      document.getElementById("photoPreview").src = capturedPhoto;
    setStatus(
      `${student.id} found. Capture a new face or save to update details.`,
    );
    await loadStudents();
  } catch (err) {
    if (err.status === 404) {
      setStatus(`${usn} is new. Fill the details and capture face.`);
      return;
    }
    setStatus(err.message || "Could not fetch student.");
  }
}

function populateProgramOptions(department, selectedProgram = "") {
  const select = document.getElementById("program");
  const programs = programsByDepartment[department] || [];
  select.innerHTML = `<option value="">Select program</option>`;
  programs.forEach((program) => {
    const option = document.createElement("option");
    option.value = program;
    option.innerText = program;
    if (program === selectedProgram) option.selected = true;
    select.appendChild(option);
  });
}

function studentMatchesFilters(student, filters) {
  return (
    (!filters.department || student.department === filters.department) &&
    (!filters.program || student.program === filters.program) &&
    (!filters.sem || String(student.sem) === String(filters.sem)) &&
    (!filters.section || student.section === filters.section)
  );
}

function renderStudentTables(students, filters) {
  const container = document.getElementById("studentTables");
  const visibleStudents = (students || []).filter((student) =>
    studentMatchesFilters(student, filters),
  );
  container.innerHTML = "";

  departmentOrder.forEach((department) => {
    const departmentStudents = visibleStudents.filter(
      (student) => student.department === department,
    );
    if (
      departmentStudents.length === 0 &&
      filters.department &&
      filters.department !== department
    )
      return;

    const departmentTitle = document.createElement("h2");
    departmentTitle.className = "department-title";
    departmentTitle.innerText = department;
    container.appendChild(departmentTitle);

    const programs = programsByDepartment[department] || [
      ...new Set(departmentStudents.map((student) => student.program)),
    ];
    programs.forEach((program) => {
      const programStudents = departmentStudents.filter(
        (student) => student.program === program,
      );
      if (
        programStudents.length === 0 &&
        (filters.program || filters.department)
      )
        return;

      const card = document.createElement("div");
      card.className = "card program-table";
      card.innerHTML = `
                <div class="program-title">
                    <strong>${program}</strong>
                    <span>${programStudents.length} student(s)</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>USN</th>
                            <th>Name</th>
                            <th>Sem</th>
                            <th>Sec</th>
                            <th>Mobile</th>
                            <th>Parent Mobile</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          programStudents
                            .map(
                              (student) => `
                            <tr>
                                <td>${student.photo || student.facePhoto ? `<img class="avatar" src="${student.photo || student.facePhoto}" alt="">` : "-"}</td>
                                <td>${student.id}</td>
                                <td>${student.name}</td>
                                <td>${student.sem || "-"}</td>
                                <td>${student.section || "-"}</td>
                                <td>${student.phone || "-"}</td>
                                <td>${student.parentPhone || "-"}</td>
                                <td>
                                    <button class="btn secondary" onclick="deleteFaceData('${student.id}')">
                                        Reset Face
                                    </button>
                                </td>
                            </tr>
                        `,
                            )
                            .join("") ||
                          `<tr><td colspan="8">No students added</td></tr>`
                        }
                    </tbody>
                </table>
            `;
      container.appendChild(card);
    });
  });

  if (!container.innerHTML.trim()) {
    container.innerHTML = `<div class="card">No students found for the selected filters.</div>`;
  }
}

async function logoutAdmin() {
  await logoutBackend();
  window.location.href = "admin-login.html";
}

async function deleteFaceData(usn) {
  const confirmDelete = confirm(
    `Delete face data for ${usn}? Student details will remain safe.`,
  );

  if (!confirmDelete) return;

  try {
    const student = await apiFetch(
      `/admin/students/${encodeURIComponent(usn)}`,
    );

    const updatedPayload = {
      ...student,
      photo: "",
      facePhoto: "",
      faceSignature: "",
    };

    await apiFetch(`/admin/students/${encodeURIComponent(usn)}`, {
      method: "PUT",
      body: JSON.stringify(updatedPayload),
    });

    setStatus(
      `Face data reset successfully for ${usn}. You can now re-register the face.`,
    );

    await loadStudents();
  } catch (err) {
    setStatus(err.message || "Failed to reset face data.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  adminUser = await requireAuth("admin");
  if (!adminUser) return;
  await loadCourses();
  document
    .getElementById("courseSelect")
    .addEventListener("change", (event) => fillCourse(event.target.value));
  document.getElementById("department").addEventListener("change", (event) => {
    populateProgramOptions(event.target.value);
    loadStudents();
  });
  ["program", "sem", "section"].forEach((id) => {
    document.getElementById(id).addEventListener("change", loadStudents);
  });
  document.getElementById("usn").addEventListener("blur", fetchStudentByUsn);
  document
    .getElementById("studentForm")
    .addEventListener("submit", saveStudent);
  await loadStudents();
});
