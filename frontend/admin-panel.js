let adminUser = null;
let courses = [];
let faceStream = null;
let capturedPhoto = "";
let capturedSignature = "";

function setStatus(message) {
    document.getElementById("status").innerText = message;
}

function value(id) {
    return document.getElementById(id).value.trim();
}

function classKey(department, program, sem, section) {
    return `attendx_faces_${department}_${program}_${sem}_${section}`.replace(/\s+/g, "_");
}

function captureSignatureFromVideo() {
    const video = document.getElementById("faceVideo");
    if (!video.videoWidth || !video.videoHeight) throw new Error("Start the camera first");

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
    return gray.map(item => item >= average ? "1" : "0").join("");
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
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
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

function saveLocalFace(student) {
    if (!capturedSignature) return;
    const key = classKey(student.department, student.program, student.sem, student.section);
    const registry = JSON.parse(localStorage.getItem(key) || "{}");
    registry[student.id] = {
        signature: capturedSignature,
        photo: capturedPhoto,
        name: student.name,
        enrolledAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(registry));
}

async function fileToDataUrl(file) {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function loadCourses() {
    courses = await apiFetch("/admin/courses");
    const select = document.getElementById("courseSelect");
    courses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.id;
        option.innerText = `${course.subject} - ${course.program} Sem ${course.sem} Sec ${course.section}`;
        select.appendChild(option);
    });
}

function fillCourse(courseId) {
    const course = courses.find(item => String(item.id) === String(courseId));
    if (!course) return;
    document.getElementById("department").value = course.department || "";
    document.getElementById("program").value = course.program || "";
    document.getElementById("sem").value = course.sem || "";
    document.getElementById("section").value = course.section || "";
}

async function loadStudents() {
    const query = buildQuery({
        department: value("department"),
        program: value("program"),
        sem: value("sem"),
        section: value("section")
    });
    const students = await apiFetch(`/admin/students?${query}`);
    const rows = document.getElementById("studentRows");
    rows.innerHTML = "";
    students.forEach(student => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${student.photo || student.facePhoto ? `<img class="avatar" src="${student.photo || student.facePhoto}" alt="">` : "-"}</td>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.program || "-"} / ${student.sem || "-"} / ${student.section || "-"}</td>
            <td>${student.phone || student.parentPhone || "-"}</td>
        `;
        rows.appendChild(tr);
    });
}

async function saveStudent(event) {
    event.preventDefault();
    const file = document.getElementById("photoFile").files[0];
    const photo = capturedPhoto || (file ? await fileToDataUrl(file) : "");
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
        photo,
        faceSignature: capturedSignature
    };

    const student = await apiFetch("/admin/students", {
        method: "POST",
        body: JSON.stringify(payload),
        timeoutMs: 12000
    });

    saveLocalFace(student);
    setStatus(`${student.id} saved for ${student.program} Sem ${student.sem} Sec ${student.section}.`);
    await loadStudents();
}

async function logoutAdmin() {
    await logoutBackend();
    window.location.href = "admin-login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    adminUser = await requireAuth("admin");
    if (!adminUser) return;
    await loadCourses();
    document.getElementById("courseSelect").addEventListener("change", event => fillCourse(event.target.value));
    document.getElementById("studentForm").addEventListener("submit", saveStudent);
    document.getElementById("photoFile").addEventListener("change", async event => {
        const file = event.target.files[0];
        if (!file) return;
        capturedPhoto = await fileToDataUrl(file);
        document.getElementById("photoPreview").src = capturedPhoto;
    });
    await loadStudents();
});
