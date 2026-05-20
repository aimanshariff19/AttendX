(function () {
    const MODEL_URL = "/models"
    const DESCRIPTOR_MATCH_THRESHOLD = 0.64
    const LEGACY_MATCH_THRESHOLD = 88
    const CAPTURE_SAMPLE_COUNT = 5
    const CAPTURE_MAX_ATTEMPTS = 9
    const CAPTURE_SAMPLE_DELAY_MS = 170

    let modelLoadPromise = null

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

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
            modelLoadPromise.then(() => {
                console.log("FaceAPI models loaded")
            })
        }

        await modelLoadPromise
        if (onStatus) onStatus("Face recognition models ready.")
    }

    function faceScore(detection, video) {
        const box = detection?.detection?.box
        if (!box || !video?.videoWidth || !video?.videoHeight) return 0

        const area = box.width * box.height
        const faceCenterX = box.x + box.width / 2
        const faceCenterY = box.y + box.height / 2
        const videoCenterX = video.videoWidth / 2
        const videoCenterY = video.videoHeight / 2
        const distanceFromCenter = Math.hypot(faceCenterX - videoCenterX, faceCenterY - videoCenterY)
        const maxDistance = Math.hypot(videoCenterX, videoCenterY) || 1
        const centerScore = 1 - Math.min(distanceFromCenter / maxDistance, 1)

        return area * (1 + centerScore)
    }

    function pickPrimaryFace(detections, video) {
        if (!Array.isArray(detections) || detections.length === 0) return null

        return detections
            .slice()
            .sort((a, b) => faceScore(b, video) - faceScore(a, video))[0]
    }

    async function detectFaceDescriptor(video) {
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.35
        })

        const results = await faceapi
            .detectAllFaces(video, options)
            .withFaceLandmarks()
            .withFaceDescriptors()
        const result = pickPrimaryFace(results, video)

        return result ? Array.from(result.descriptor) : null
    }

    async function detectFaceInVideo(video, onStatus) {
        if (!video || !video.videoWidth || !video.videoHeight) {
            throw new Error("Start the camera first")
        }

        await ensureModels(onStatus)

        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.35
        })
        const results = await faceapi.detectAllFaces(video, options)
        return results.length > 0
    }

    function averageDescriptors(descriptors) {
        if (!Array.isArray(descriptors) || descriptors.length === 0) return null

        const average = new Array(128).fill(0)
        descriptors.forEach(descriptor => {
            descriptor.forEach((value, index) => {
                average[index] += Number(value) || 0
            })
        })

        return average.map(value => value / descriptors.length)
    }

    async function captureSignatureFromVideo(video, onStatus, options = {}) {
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

        const sampleTarget = Math.max(1, options.sampleCount || CAPTURE_SAMPLE_COUNT)
        const descriptors = []

        if (onStatus && sampleTarget > 1) {
            onStatus("Scanning face... slowly turn left, center, and right.")
        }

        for (let attempt = 0; attempt < CAPTURE_MAX_ATTEMPTS && descriptors.length < sampleTarget; attempt++) {
            const descriptor = await detectFaceDescriptor(video)
            if (descriptor) {
                descriptors.push(descriptor)
                if (onStatus && sampleTarget > 1) {
                    onStatus(`Captured face sample ${descriptors.length}/${sampleTarget}.`)
                }
            }

            if (descriptors.length < sampleTarget) {
                await wait(CAPTURE_SAMPLE_DELAY_MS)
            }
        }

        if (descriptors.length === 0) {
            throw new Error("No clear face detected. Face the camera and try better lighting.")
        }

        const averaged = averageDescriptors(descriptors)

        return JSON.stringify({
            version: "face-api-v2",
            model: "tiny-face-detector-face-recognition-net",
            descriptor: averaged,
            descriptors
        })
    }

    function normalizeDescriptor(descriptor) {
        if (!Array.isArray(descriptor) || descriptor.length !== 128) return null

        const normalized = descriptor.map(Number)
        return normalized.every(Number.isFinite) ? normalized : null
    }

    function extractDescriptors(parsed) {
        if (Array.isArray(parsed) && parsed.length === 128) {
            const descriptor = normalizeDescriptor(parsed)
            return descriptor ? [descriptor] : []
        }

        if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
            return parsed.map(normalizeDescriptor).filter(Boolean)
        }

        const descriptors = []
        if (Array.isArray(parsed?.descriptor)) {
            const descriptor = normalizeDescriptor(parsed.descriptor)
            if (descriptor) descriptors.push(descriptor)
        }

        if (Array.isArray(parsed?.descriptors)) {
            parsed.descriptors.forEach(value => {
                const descriptor = normalizeDescriptor(value)
                if (descriptor) descriptors.push(descriptor)
            })
        }

        return descriptors
    }

    function parseSignature(signature) {
        if (!signature || typeof signature !== "string") return null

        const trimmed = signature.trim()
        if (/^[01]{256}$/.test(trimmed)) {
            return { type: "legacy", bits: trimmed }
        }

        try {
            const parsed = JSON.parse(trimmed)
            const descriptors = extractDescriptors(parsed)

            if (descriptors.length === 0) return null

            return { type: "descriptor", descriptors }
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
            let best = Number.POSITIVE_INFINITY

            currentParsed.descriptors.forEach(currentDescriptor => {
                savedParsed.descriptors.forEach(savedDescriptor => {
                    best = Math.min(best, euclideanDistance(currentDescriptor, savedDescriptor))
                })
            })

            return best
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
        detectFaceInVideo,
        legacySignatureFromVideo,
        signatureDistance,
        isMatch
    }
})()
