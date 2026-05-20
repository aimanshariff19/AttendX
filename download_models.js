const fs = require('fs');
const path = require('path');
const https = require('https');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const MODELS_DIR = path.join(FRONTEND_DIR, 'models');

if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
}

const files = [
    {
        url: 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
        dest: path.join(FRONTEND_DIR, 'face-api.min.js')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json',
        dest: path.join(MODELS_DIR, 'tiny_face_detector_model-weights_manifest.json')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1',
        dest: path.join(MODELS_DIR, 'tiny_face_detector_model-shard1')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json',
        dest: path.join(MODELS_DIR, 'face_landmark_68_model-weights_manifest.json')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1',
        dest: path.join(MODELS_DIR, 'face_landmark_68_model-shard1')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json',
        dest: path.join(MODELS_DIR, 'face_recognition_model-weights_manifest.json')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1',
        dest: path.join(MODELS_DIR, 'face_recognition_model-shard1')
    },
    {
        url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2',
        dest: path.join(MODELS_DIR, 'face_recognition_model-shard2')
    }
];

function download(url, dest) {
    return new Promise((resolve, reject) => {
        function get(targetUrl) {
            https.get(targetUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    get(response.headers.location);
                    return;
                }
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${targetUrl}: Status Code ${response.statusCode}`));
                    return;
                }
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${path.basename(dest)}`);
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err);
            });
        }
        get(url);
    });
}

async function run() {
    console.log('Downloading face-api models and library locally...');
    for (const file of files) {
        try {
            await download(file.url, file.dest);
        } catch (err) {
            console.error(`Error downloading ${file.url}:`, err.message);
        }
    }
    console.log('All downloads completed successfully!');
}

run();
