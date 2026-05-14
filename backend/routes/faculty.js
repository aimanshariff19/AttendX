const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabase');
const { attendanceSlotDisplay } = require('../attendance_time_format');

/** Persist `attendance.time_slot` as "9:00 AM - 11:00 AM" even if the client sends `09:00` only (cached/old UI). */
function normalizeAttendanceSlotTime(rawTime, numClasses) {
    const nc =
        Number.isFinite(Number(numClasses)) && Number(numClasses) > 0
            ? Number(numClasses)
            : 1;
    if (rawTime === undefined || rawTime === null) return rawTime;
    return attendanceSlotDisplay(String(rawTime).trim(), nc);
}

/** Raw DB column (`time_slot` preferred, legacy `time`). */
function storedSlotRaw(row) {
    if (!row || typeof row !== 'object') return '';
    const v = row.time_slot ?? row.time;
    return v === undefined || v === null ? '' : String(v).trim();
}

function rowCanonicalSlotKey(row) {
    const raw = storedSlotRaw(row);
    const k = normalizeAttendanceSlotTime(raw, row.numClasses ?? row.num_classes);
    return k === undefined || k === null ? '' : String(k);
}

/** Compare dropdown/query value to row (handles legacy `time`, canonical range strings). */
function canonicalIncomingMatchesRow(incomingRaw, row) {
    const want = normalizeAttendanceSlotTime(String(incomingRaw).trim(), undefined);
    const w = want === undefined || want === null ? '' : String(want);
    return w === rowCanonicalSlotKey(row);
}

function filterRowsByIncomingSlot(rows, incomingTime) {
    if (!incomingTime || String(incomingTime).trim() === '') return rows ?? [];
    return (rows ?? []).filter((r) => canonicalIncomingMatchesRow(incomingTime, r));
}

/** Sort without relying on `.order(time_slot)` (column may still be `time` on older DBs). */
function sortAttendanceRowsForCourse(rows) {
    return (rows ?? []).slice().sort((a, b) => {
        const dc = String(a.date || '').localeCompare(String(b.date || ''));
        if (dc !== 0) return dc;
        return rowCanonicalSlotKey(a).localeCompare(rowCanonicalSlotKey(b));
    });
}

function checkSupabase(res) {
    if (!supabase) {
        return res.status(500).json({ msg: 'Supabase is not configured' });
    }
    return null;
}

function buildAbsenceMessages(student, course, consecutiveDays) {
    const name = student?.name || student?.id || 'Student';
    const className = `${course.department} ${course.program} Sem ${course.sem} Sec ${course.section}`;

    return {
        en: `${name} has been absent for ${consecutiveDays} consecutive days in ${course.subject} (${className}).`,
        kn: `${name} ಅವರು ${course.subject} (${className}) ವಿಷಯದಲ್ಲಿ ನಿರಂತರ ${consecutiveDays} ದಿನ ಗೈರಾಗಿದ್ದಾರೆ.`,
        hi: `${name} ${course.subject} (${className}) में लगातार ${consecutiveDays} दिनों से अनुपस्थित है।`
    };
}

function latestConsecutiveAbsenceDays(attendances, studentId) {
    const byDate = new Map();

    (attendances || []).forEach(day => {
        const rec = (day.records || []).find(r => r.studentId === studentId);
        if (!rec) return;
        byDate.set(day.date, rec.status);
    });

    const dates = [...byDate.keys()].sort().reverse();
    let count = 0;

    for (const date of dates) {
        if (byDate.get(date) === 'Absent') {
            count++;
        } else {
            break;
        }
    }

    return count;
}

async function getClassCoordinator(course) {
    const { data, error } = await supabase
        .from('class_coordinators')
        .select('*')
        .match({
            department: course.department,
            program: course.program,
            sem: course.sem,
            section: course.section
        })
        .maybeSingle();

    if (error) {
        console.error(error.message);
        return null;
    }

    return data;
}

async function getUser(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error(error.message);
        return null;
    }

    return data;
}

async function insertAlert({ userId, recipientRole, phone, title, type, message, messages, channels }) {
    const { error } = await supabase
        .from('notifications')
        .insert({
            studentId: userId,
            user_id: userId,
            recipient_role: recipientRole,
            phone,
            title,
            type,
            message,
            messages,
            channels
        });

    if (error) {
        console.error(error.message);
    }
}

async function sendAbsenceAlerts(course, records, attendances) {
    const coordinator = await getClassCoordinator(course);
    const faculty = await getUser(course.facultyId);

    for (const [studentId, record] of Object.entries(records || {})) {
        if (record.status !== 'Absent') continue;

        const consecutiveDays = latestConsecutiveAbsenceDays(attendances, studentId);
        if (consecutiveDays !== 2 && consecutiveDays < 4) continue;

        const student = await getUser(studentId);
        const messages = buildAbsenceMessages(student, course, consecutiveDays);
        const isCritical = consecutiveDays >= 4;
        const title = isCritical ? 'Critical Attendance Alert' : 'Attendance Warning';
        const type = isCritical ? 'critical' : 'warning';
        const channels = isCritical ? ['app', 'sms', 'whatsapp'] : ['app'];

        await insertAlert({
            userId: studentId,
            recipientRole: 'student',
            phone: student?.phone || null,
            title,
            type,
            message: messages.en,
            messages,
            channels
        });

        if (coordinator) {
            await insertAlert({
                userId: coordinator.user_id || coordinator.id || null,
                recipientRole: 'class_coordinator',
                phone: coordinator.phone || null,
                title,
                type,
                message: messages.en,
                messages,
                channels
            });
        }

        await insertAlert({
            userId: studentId,
            recipientRole: 'parent',
            phone: student?.parentPhone || null,
            title,
            type,
            message: messages.en,
            messages,
            channels: ['sms', 'whatsapp']
        });

        if (isCritical) {
            await insertAlert({
                userId: faculty?.id || course.facultyId,
                recipientRole: 'subject_faculty',
                phone: faculty?.phone || null,
                title,
                type,
                message: messages.en,
                messages,
                channels
            });
        }
    }
}

// @route   GET api/faculty/courses
// @desc    Get assigned courses for logged in faculty
router.get('/courses', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('*')
            .eq('facultyId', req.user.id);

        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/faculty/students
// @desc    Get students for a specific course/class
router.get('/students', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { department, program, sem, section } = req.query;
    try {
        let query = supabase.from('users').select('*').eq('role', 'student');

        if (department) query = query.eq('department', department);
        if (program) query = query.eq('program', program);
        if (sem) query = query.eq('sem', sem);
        if (section) query = query.eq('section', section);

        const { data: students, error } = await query;

        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/faculty/attendance
// @desc    Submit attendance
router.post('/attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time, numClasses, records } = req.body;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) {
            return res.status(403).json({ msg: 'Not authorized for this course' });
        }

        const slotTime = normalizeAttendanceSlotTime(time, numClasses);
        if (
            slotTime === undefined ||
            slotTime === null ||
            String(slotTime).trim() === ''
        ) {
            return res.status(400).json({ msg: 'Missing or invalid time slot' });
        }

        const { data: dayRows, error: dayFetchError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .eq('date', date);

        if (dayFetchError) {
            console.error(dayFetchError.message);
            return res.status(500).send('Server Error');
        }

        const existingAttendance = (dayRows || []).find(
            (row) =>
                normalizeAttendanceSlotTime(
                    row.time_slot ?? row.time,
                    row.numClasses ?? row.num_classes
                ) === slotTime
        );

        if (existingAttendance) {
            return res.status(400).json({ msg: 'Attendance already marked for this slot' });
        }

        const attendancePayload = {
            courseId: course.id,
            date,
            time_slot: slotTime,
            numClasses: numClasses || 1,
            records: Object.keys(records).map(usn => ({
                studentId: usn,
                status: records[usn].status,
                reason: records[usn].reason || ''
            }))
        };

        let { data: attendance, error: insertError } = await supabase
            .from('attendance')
            .insert(attendancePayload)
            .select()
            .single();

        const hint = `${insertError?.message || ''} ${insertError?.details || ''}`;
        if (insertError && /time_slot/i.test(hint)) {
            const legacyPayload = {
                courseId: course.id,
                date,
                time: slotTime,
                numClasses: numClasses || 1,
                records: attendancePayload.records
            };
            ({
                data: attendance,
                error: insertError
            } = await supabase.from('attendance').insert(legacyPayload).select().single());
        }

        if (insertError) {
            console.error(insertError.message);
            return res.status(500).json({
                msg: insertError.message || 'Server Error',
                detail: insertError.details || insertError.hint || ''
            });
        }

        const { data: allRows, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .order('date', { ascending: true });

        if (attendanceError) {
            console.error(attendanceError.message);
            return res.status(500).send('Server Error');
        }

        const allAttendance = sortAttendanceRowsForCourse(allRows || []);

        await sendAbsenceAlerts(course, records, allAttendance);

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/faculty/face-scan-attendance
// @desc    Mark one student present from the face recognition device flow
router.post('/face-scan-attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time, numClasses, studentId } = req.body;

    try {
        if (!studentId) return res.status(400).json({ msg: 'Missing student ID from scan' });

        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) {
            return res.status(403).json({ msg: 'Not authorized for this course' });
        }

        const slotTime = normalizeAttendanceSlotTime(time, numClasses);
        if (!date || !slotTime || String(slotTime).trim() === '') {
            return res.status(400).json({ msg: 'Missing date or time slot' });
        }

        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('id,name,department,program,sem,section,role')
            .match({ id: studentId, role: 'student', department, program, sem, section })
            .maybeSingle();

        if (studentError) {
            console.error(studentError.message);
            return res.status(500).send('Server Error');
        }

        if (!student) {
            return res.status(404).json({ msg: 'Scanned student is not in this class' });
        }

        const { data: dayRows, error: dayFetchError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .eq('date', date);

        if (dayFetchError) {
            console.error(dayFetchError.message);
            return res.status(500).send('Server Error');
        }

        const existingAttendance = (dayRows || []).find(
            (row) =>
                normalizeAttendanceSlotTime(
                    row.time_slot ?? row.time,
                    row.numClasses ?? row.num_classes
                ) === slotTime
        );

        if (existingAttendance) {
            const records = Array.isArray(existingAttendance.records) ? existingAttendance.records.slice() : [];
            const idx = records.findIndex((r) => r.studentId === studentId);
            const scannedRecord = {
                studentId,
                status: 'Present',
                reason: '',
                markedBy: 'face_device',
                scannedAt: new Date().toISOString()
            };

            if (idx >= 0) records[idx] = { ...records[idx], ...scannedRecord };
            else records.push(scannedRecord);

            const { data: updatedAttendance, error: updateError } = await supabase
                .from('attendance')
                .update({ records })
                .eq('id', existingAttendance.id)
                .select()
                .single();

            if (updateError) {
                console.error(updateError.message);
                return res.status(500).send('Server Error');
            }

            return res.json({ attendance: updatedAttendance, student, created: false });
        }

        const { data: students, error: studentsError } = await supabase
            .from('users')
            .select('id')
            .match({ role: 'student', department, program, sem, section });

        if (studentsError) {
            console.error(studentsError.message);
            return res.status(500).send('Server Error');
        }

        const attendancePayload = {
            courseId: course.id,
            date,
            time_slot: slotTime,
            numClasses: numClasses || 1,
            records: (students || []).map((s) => ({
                studentId: s.id,
                status: s.id === studentId ? 'Present' : 'Absent',
                reason: '',
                markedBy: s.id === studentId ? 'face_device' : 'auto_absent',
                scannedAt: s.id === studentId ? new Date().toISOString() : null
            }))
        };

        let { data: attendance, error: insertError } = await supabase
            .from('attendance')
            .insert(attendancePayload)
            .select()
            .single();

        const hint = `${insertError?.message || ''} ${insertError?.details || ''}`;
        if (insertError && /time_slot/i.test(hint)) {
            const legacyPayload = {
                courseId: course.id,
                date,
                time: slotTime,
                numClasses: numClasses || 1,
                records: attendancePayload.records
            };
            ({ data: attendance, error: insertError } = await supabase
                .from('attendance')
                .insert(legacyPayload)
                .select()
                .single());
        }

        if (insertError) {
            console.error(insertError.message);
            return res.status(500).json({
                msg: insertError.message || 'Server Error',
                detail: insertError.details || insertError.hint || ''
            });
        }

        res.json({ attendance, student, created: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/faculty/attendance
// @desc    Get attendance for edit
router.get('/attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time } = req.query;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) return res.status(404).json({ msg: 'Course not found' });

        let qb = supabase.from('attendance').select('*').eq('courseId', course.id);

        if (date) qb = qb.eq('date', date);

        const { data: rows, error } = await qb;
        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        const attendances = filterRowsByIncomingSlot(rows, time);

        res.json(attendances);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/faculty/attendance
// @desc    Update attendance
router.put('/attendance', auth('faculty'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { subject, department, program, sem, section, date, time, records } = req.body;

    try {
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .match({ subject, department, program, sem, section, facultyId: req.user.id })
            .single();

        if (courseError || !course) return res.status(403).json({ msg: 'Not authorized for this course' });

        const { data: dayRows, error: dayFetchError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .eq('date', date);

        if (dayFetchError) {
            console.error(dayFetchError.message);
            return res.status(500).send('Server Error');
        }

        const matches = filterRowsByIncomingSlot(dayRows, time);
        const attendance = matches[0];

        if (!attendance) {
            return res.status(404).json({ msg: 'Attendance record not found' });
        }

        const updatedRecords = Object.keys(records).map(usn => ({
            studentId: usn,
            status: records[usn].status,
            reason: records[usn].reason || ''
        }));

        const { data: updatedAttendance, error: updateError } = await supabase
            .from('attendance')
            .update({ records: updatedRecords })
            .eq('id', attendance.id)
            .select()
            .single();

        if (updateError) {
            console.error(updateError.message);
            return res.status(500).send('Server Error');
        }

        const { data: allRows, error: attendanceListError } = await supabase
            .from('attendance')
            .select('*')
            .eq('courseId', course.id)
            .order('date', { ascending: true });

        if (attendanceListError) {
            console.error(attendanceListError.message);
            return res.status(500).send('Server Error');
        }

        const allAttendance = sortAttendanceRowsForCourse(allRows || []);

        await sendAbsenceAlerts(course, records, allAttendance);

        res.json(updatedAttendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
