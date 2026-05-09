const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TRANSLATIONS = {
    "English": {
        subject: "Attendance Alert",
        template: "Dear Parent, your child {name} was absent for the following classes on {date}:\n\n{details}\n\nPlease ensure regular attendance.",
        allDay: "Dear Parent, your child {name} did not attend ANY classes today ({date}). Please contact the coordinator.",
        separator: " - "
    },
    "Kannada": {
        subject: "ಹಾಜರಾತಿ ಎಚ್ಚರಿಕೆ",
        template: "ಗೌರವಾನ್ವಿತ ಪೋಷಕರೇ, ನಿಮ್ಮ ಮಗು {name} {date} ರಂದು ಈ ಕೆಳಗಿನ ತರಗತಿಗಳಿಗೆ ಗೈರುಹಾಜರಾಗಿದ್ದಾರೆ:\n\n{details}\n\nದಯವಿಟ್ಟು ನಿಯಮಿತ ಹಾಜರಾತಿಯನ್ನು ಖಚಿತಪಡಿಸಿ.",
        allDay: "ಗೌರವಾನ್ವಿತ ಪೋಷಕರೇ, ನಿಮ್ಮ ಮಗು {name} ಇಂದು ({date}) ಯಾವುದೇ ತರಗತಿಗಳಿಗೆ ಹಾಜರಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಂಯೋಜಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        separator: " - "
    },
    "Hindi": {
        subject: "उपस्थिति चेतावनी",
        template: "आदरणीय अभिभावक, आपका बच्चा {name} {date} को निम्नलिखित कक्षाओं में अनुपस्थित था:\n\n{details}\n\nकृपया नियमित उपस्थिति सुनिश्चित करें।",
        allDay: "आदरणीय अभिभावक, आपका बच्चा {name} आज ({date}) किसी भी कक्षा में उपस्थित नहीं था। कृपया समन्वयक से संपर्क करें।",
        separator: " - "
    }
};

/**
 * Aggregates attendance for a specific date and sends notifications
 */
async function sendDailyNotifications(targetDate) {
    console.log(`[NotificationService] Aggregating attendance for ${targetDate}...`);
    
    try {
        // 1. Fetch all attendance records for the date
        const { data: attendanceRecords, error: attError } = await supabase
            .from('attendance')
            .select('*, courses(*)')
            .eq('date', targetDate);

        if (attError) throw attError;
        if (!attendanceRecords || attendanceRecords.length === 0) {
            console.log("No attendance records found for this date.");
            return;
        }

        // 2. Identify absentees and group by studentId
        const studentAbsences = {}; // { studentId: [{ subject, time }] }
        const totalClassesPerStudent = {}; // { studentId: count }

        attendanceRecords.forEach(record => {
            const subject = record.courses.subject;
            const time = record.time;
            const records = record.records; // This is a JSON object/array from our table

            // Normalize records to an array if it's an object, or just use it if it's an array
            const normalizedRecords = Array.isArray(records) 
                ? records 
                : Object.entries(records).map(([usn, data]) => ({ studentId: usn, ...data }));

            normalizedRecords.forEach(rec => {
                const usn = rec.studentId || rec.usn;
                if (!usn) return;

                if (!totalClassesPerStudent[usn]) totalClassesPerStudent[usn] = 0;
                totalClassesPerStudent[usn]++;

                if (rec.status === 'Absent') {
                    if (!studentAbsences[usn]) studentAbsences[usn] = [];
                    studentAbsences[usn].push({ subject, time });
                }
            });
        });

        // 3. Process each student who has at least one absence
        const absentees = Object.keys(studentAbsences);
        console.log(`Found ${absentees.length} students with absences.`);

        for (const usn of absentees) {
            const absences = studentAbsences[usn];
            const totalScheduled = totalClassesPerStudent[usn];

            // 4. Fetch Parent Details (Phone, Email, Language)
            const { data: student, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', usn)
                .single();

            if (userError || !student) {
                console.error(`Could not find student details for ${usn}`);
                continue;
            }

            const parentPhone = student.parentPhone || student.phone;
            const parentEmail = student.email;
            
            // 🔥 COMBINE ALL 3 LANGUAGES
            let combinedMessage = "";
            const languages = ["English", "Kannada", "Hindi"];

            languages.forEach((lang, idx) => {
                const t = TRANSLATIONS[lang];
                let langMsg = "";

                if (absences.length === totalScheduled && totalScheduled > 1) {
                    langMsg = t.allDay.replace("{name}", student.name).replace("{date}", targetDate);
                } else {
                    const details = absences.map(a => `${a.subject}${t.separator}${a.time}`).join("\n");
                    langMsg = t.template.replace("{name}", student.name).replace("{date}", targetDate).replace("{details}", details);
                }

                combinedMessage += (idx > 0 ? "\n\n---\n\n" : "") + langMsg;
            });

            // 5. Send via SMS / WhatsApp / Email (Mocking for now)
            await dispatchNotification({
                to: parentPhone,
                email: parentEmail,
                subject: "Attendance Alert / ಹಾಜರಾತಿ ಎಚ್ಚರಿಕೆ / उपस्थिति चेतावनी",
                message: combinedMessage,
                studentId: usn,
                studentName: student.name
            });
        }

    } catch (err) {
        console.error("Error in notification service:", err);
    }
}

/**
 * Dispatches the message through multiple channels
 */
/**
 * Dispatches the message through multiple channels
 */
async function dispatchNotification(data) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
    
    let isLive = accountSid && authToken;

    console.log(`\n\x1b[35m================================================================================\x1b[0m`);
    console.log(`\x1b[1m\x1b[36m📤 SENDING MULTI-CHANNEL NOTIFICATION\x1b[0m`);
    console.log(`\x1b[35m--------------------------------------------------------------------------------\x1b[0m`);
    console.log(`\x1b[1mStudent  :\x1b[0m ${data.studentName} (\x1b[33m${data.studentId}\x1b[0m)`);
    console.log(`\x1b[1mParent   :\x1b[0m 📱 ${data.to} | 📧 ${data.email}`);
    console.log(`\x1b[1mSubject  :\x1b[0m ${data.subject}`);
    console.log(`\x1b[35m--------------------------------------------------------------------------------\x1b[0m`);
    console.log(`\x1b[1m📜 MESSAGE PREVIEW:\x1b[0m\n\n${data.message}`);
    console.log(`\x1b[35m--------------------------------------------------------------------------------\x1b[0m`);
    
    if (isLive) {
        try {
            const client = require('twilio')(accountSid, authToken);
            
            // 1. Send WhatsApp
            const formattedPhone = data.to.startsWith('+') ? data.to : `+91${data.to}`;
            
            await client.messages.create({
                body: data.message,
                from: `whatsapp:${fromWhatsApp}`,
                to: `whatsapp:${formattedPhone}`
            });
            console.log(`\x1b[32m✔ WhatsApp Sent Successfully (Twilio)\x1b[0m`);

            // 2. Send SMS (Optional - usually costs extra credits)
            // await client.messages.create({ body: data.message, from: process.env.TWILIO_SMS_NUMBER, to: formattedPhone });
            // console.log(`\x1b[32m✔ SMS Sent Successfully (Twilio)\x1b[0m`);

        } catch (err) {
            console.error(`\x1b[31m✘ Twilio Error: ${err.message}\x1b[0m`);
        }
    } else {
        console.log(`\x1b[33m💡 Running in MOCK MODE (Add Twilio credentials to .env for live sending)\x1b[0m`);
        console.log(`\x1b[32m✔ [MOCK] SMS Sent\x1b[0m`);
        console.log(`\x1b[32m✔ [MOCK] Email Sent\x1b[0m`);
    }

    console.log(`\x1b[35m================================================================================\x1b[0m\n`);

    // 6. Log to notifications table in DB
    try {
        await supabase.from('notifications').insert({
            studentId: data.studentId,
            title: data.subject,
            message: data.message,
            phone: data.to,
            type: 'absence_report',
            channels: ['sms', 'whatsapp', 'email'],
            created_at: new Date()
        });
    } catch (e) {
        console.error("Failed to log notification:", e);
    }
}

module.exports = { sendDailyNotifications };
