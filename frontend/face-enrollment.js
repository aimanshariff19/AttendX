let subject = ""
let department = ""
let program = ""
let sem = ""
let section = ""
let faceStream = null
let studentList = []

function setText(id, value) {
    const el = document.getElementById(id)
    if (el) el.innerText = value || "-"
}

function setStatus(message) {
    const el = document.getElementById("enrollStatus")
    if (el) el.innerText = message
}

function setBtnLoading(btn, text = "Loading") {
    if (!btn || btn.classList.contains("loading")) return
    btn.dataset.original = btn.innerHTML
    btn.classList.add("loading")
    btn.innerHTML = `${text} <span class="btn-spinner"></span>`
}

function resetBtn(btn) {
    if (!btn) return
    btn.classList.remove("loading")
    if (btn.dataset.original) btn.innerHTML = btn.dataset.original
}

function faceClassKey() {
    return `attendx_faces_${department}_${program}_${sem}_${section}`.replace(/\s+/g, "_")
}

async function startCamera(btn) {
    const video = document.getElementById("faceVideo")
    try {
        setBtnLoading(btn, "Starting")
        if (!faceStream) {
            faceStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            })
        }
        video.srcObject = faceStream
        await video.play()
        setStatus("Camera ready. Select a student and save their face.")
    } catch (err) {
        console.error(err)
        setStatus("Camera permission is required.")
        alert("Allow camera access")
    } finally {
        resetBtn(btn)
    }
}

function captureFaceSignature() {
    const video = document.getElementById("faceVideo")
    if (!video || !video.videoWidth || !video.videoHeight) {
        throw new Error("Start the camera first")
    }

    const canvas = document.createElement("canvas")
    const size = 16
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0, size, size)
    const data = ctx.getImageData(0, 0, size, size).data
    const gray = []

    for (let i = 0; i < data.length; i += 4) {
        gray.push(Math.round((data[i] + data[i + 1] + data[i + 2]) / 3))
    }

    const average = gray.reduce((sum, value) => sum + value, 0) / gray.length
    return gray.map(value => (value >= average ? "1" : "0")).join("")
}

function getRegistry() {
    try {
        return JSON.parse(localStorage.getItem(faceClassKey()) || "{}")
    } catch {
        return {}
    }
}

function saveRegistry(registry) {
    localStorage.setItem(faceClassKey(), JSON.stringify(registry || {}))
}

async function enrollFace(btn) {
    try {
        setBtnLoading(btn, "Saving")
        if (!faceStream) await startCamera()

        const select = document.getElementById("studentSelect")
        const studentId = select?.value
        if (!studentId) {
            alert("Select student")
            return
        }

        const registry = getRegistry()
        registry[studentId] = {
            signature: captureFaceSignature(),
            enrolledAt: new Date().toISOString()
        }
        saveRegistry(registry)
        setStatus(`${studentId} face saved on this device.`)
    } catch (err) {
        console.error(err)
        setStatus(err.message || "Enrollment failed.")
        alert(err.message || "Could not save face")
    } finally {
        resetBtn(btn)
    }
}

function populateStudents() {
    const select = document.getElementById("studentSelect")
    select.innerHTML = `<option value="">Select student</option>`
    studentList.forEach(student => {
        const option = document.createElement("option")
        option.value = student.id || student.usn
        option.innerText = `${student.id || student.usn} - ${student.name}`
        select.appendChild(option)
    })
}

function goBack() {
    window.location.href = "dashboard.html"
}

window.onload = async function () {
    await requireAuth("faculty")

    const params = getQueryParams()
    subject = params.subject || ""
    department = params.department || ""
    program = params.program || ""
    sem = params.sem || ""
    section = params.section || ""

    if (!department || !program || !sem || !section) {
        window.location.href = "dashboard.html"
        return
    }

    setText("subject", subject)
    setText("department", department)
    setText("program", program)
    setText("sem", sem)
    setText("section", section)

    try {
        studentList = await apiFetch(`/faculty/students?${buildQuery({ department, program, sem, section })}`)
        populateStudents()
    } catch (err) {
        console.error(err)
        setStatus("Unable to load students.")
    }
}
