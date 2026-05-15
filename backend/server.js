const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

console.log('Starting server...');

const app = express();

// Init Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Debug route
app.post('/debug-login', (req, res) => {
    console.log('DEBUG /debug-login body:', req.body);
    res.json({ ok: true, body: req.body });
});

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Define Routes
console.log('Mounting routes...');
app.use('/api/auth', require('./routes/auth'));
console.log('Auth routes mounted');
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/student', require('./routes/student'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/admin', require('./routes/admin'));
console.log('All routes mounted');

// Catch-all route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get(['/dashboard', '/dashboard.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get(['/student-dashboard', '/student-dashboard.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/student-dashboard.html'));
});

app.get(['/hod-dashboard', '/hod-dashboard.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/hod-dashboard.html'));
});

app.get(['/admin-panel', '/admin-panel.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-panel.html'));
});

const cron = require('node-cron');
const { sendDailyNotifications } = require('./notification_service');

// Schedule daily notifications at 5:00 PM (17:00)
cron.schedule('0 17 * * *', () => {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[CRON] Triggering daily notifications for ${today}...`);
    sendDailyNotifications(today);
}, {
    timezone: "Asia/Kolkata"
});

const PORT = process.env.PORT || 5000;

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ msg: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('Server is listening...');
});
