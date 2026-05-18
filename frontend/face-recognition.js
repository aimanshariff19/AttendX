(function () {
    const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights"
    const DESCRIPTOR_MATCH_THRESHOLD = 0.6
    const LEGACY_MATCH_THRESHOLD = 88

    let modelLoadPromise = null

    function legacySignatureFromVideo(video) {
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

    async function ensureModels(onStatus) {
        if (!window.faceapi) {
            throw new Error("Face recognition library could not load. Check internet connection and refresh.")
        }

        if (!modelLoadPromise) {
            if (onStatus) onStatus("Loading face recognition models...")
            modelLoadPromise = Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ])
        }

        await modelLoadPromise
        if (onStatus) onStatus("Face recognition models ready.")
    }

    async function captureSignatureFromVideo(video, onStatus) {
        if (!video || !video.videoWidth || !video.videoHeight) {
            throw new Error("Start the camera first")
        }

        try {
            await ensureModels(onStatus)
        } catch (err) {
            console.warn(err)
            if (onStatus) onStatus("Advanced face recognition unavailable. Using basic mode.")
            return legacySignatureFromVideo(video)
        }

        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
        })
        const result = await faceapi
            .detectSingleFace(video, options)
            .withFaceLandmarks()
            .withFaceDescriptor()

        if (!result) {
            throw new Error("No clear face detected. Face the camera and try better lighting.")
        }

        return JSON.stringify({
            version: "face-api-v1",
            model: "tiny-face-detector-face-recognition-net",
            descriptor: Array.from(result.descriptor)
        })
    }

    function parseSignature(signature) {
        if (!signature || typeof signature !== "string") return null

        const trimmed = signature.trim()
        if (/^[01]{256}$/.test(trimmed)) {
            return { type: "legacy", bits: trimmed }
        }

        try {
            const parsed = JSON.parse(trimmed)
            const descriptor = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed?.descriptor)
                    ? parsed.descriptor
                    : null

            if (!descriptor || descriptor.length !== 128) return null

            return {
                type: "descriptor",
                descriptor: descriptor.map(Number)
            }
        } catch {
            return null
        }
    }

    function euclideanDistance(a, b) {
        if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY

        let sum = 0
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i]
            sum += diff * diff
        }
        return Math.sqrt(sum)
    }

    function hammingDistance(a, b) {
        if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY

        let diff = 0
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) diff++
        }
        return diff
    }

    function signatureDistance(current, saved) {
        const currentParsed = parseSignature(current)
        const savedParsed = parseSignature(saved)

        if (!currentParsed || !savedParsed || currentParsed.type !== savedParsed.type) {
            return Number.POSITIVE_INFINITY
        }

        if (currentParsed.type === "descriptor") {
            return euclideanDistance(currentParsed.descriptor, savedParsed.descriptor)
        }

        return hammingDistance(currentParsed.bits, savedParsed.bits)
    }

    function isMatch(signature, distance) {
        const parsed = parseSignature(signature)
        if (!parsed || !Number.isFinite(distance)) return false

        return parsed.type === "descriptor"
            ? distance <= DESCRIPTOR_MATCH_THRESHOLD
            : distance <= LEGACY_MATCH_THRESHOLD
    }

    window.AttendXFaceRecognition = {
        captureSignatureFromVideo,
        legacySignatureFromVideo,
        signatureDistance,
        isMatch
    }
})()
