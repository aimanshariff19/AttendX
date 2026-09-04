const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabase');

function checkSupabase(res) {
    if (!supabase) {
        return res.status(500).json({ msg: 'Supabase is not configured' });
    }
    return null;
}

function calculateAttendancePercent(attendances, studentId, beforeDate) {
    let conducted = 0;
    let present = 0;

    (attendances || []).forEach(day => {
        if (beforeDate && String(day.date || '') >= beforeDate) return;

        const record = (day.records || []).find(r => r.studentId === studentId);
        if (record) {
            conducted += day.numClasses || 1;
            if (record.status === 'Present') {
                present += day.numClasses || 1;
            }
        }
    });

    return conducted === 0 ? 100 : Math.round((present / conducted) * 100);
}

// @route   GET api/hod/courses
// @desc    Get all courses
router.get('/courses', auth('hod'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select('*');

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

// @route   GET api/hod/students
// @desc    Get students with their stats for a class
router.get('/students', auth('hod'), async (req, res) => {
    console.log('[HOD STUDENTS] START', req.query);
    const err = checkSupabase(res);
    if (err) return err;

    const { department: requestedDepartment, program, sem, section, cie1Date, cie2Date } = req.query;
    const department = requestedDepartment || req.user.department;

    try {
        console.log('[HOD STUDENTS] BEFORE USERS QUERY');
        let studentQuery = supabase.from('users').select('*').eq('role', 'student').eq('department', department);
        
        console.log('[HOD STUDENTS] BEFORE COURSES QUERY');
        let courseQuery = supabase.from('courses').select('*').eq('department', department);

        if (program) {
            studentQuery = studentQuery.eq('program', program);
            courseQuery = courseQuery.eq('program', program);
        }
        if (sem) {
            studentQuery = studentQuery.eq('sem', sem);
            courseQuery = courseQuery.eq('sem', sem);
        }
        if (section) {
            studentQuery = studentQuery.eq('section', section);
            courseQuery = courseQuery.eq('section', section);
        }

        const [{ data: students, error: studentsError }, { data: courses, error: coursesError }] = await Promise.all([
            studentQuery,
            courseQuery
        ]);

        console.log('[HOD STUDENTS] AFTER INITIAL QUERIES', {
            studentCount: students?.length,
            courseCount: courses?.length
        });

        if (studentsError || coursesError) {
            console.error(studentsError?.message || coursesError?.message);
            return res.status(500).send('Server Error');
        }

        console.log('[HOD STUDENTS] BEFORE PROCESSING');
        const result = [];

        for (const student of students) {
            const studentStats = {
                usn: student.id,
                name: student.name,
                department: student.department,
                program: student.program,
                sem: student.sem,
                section: student.section,
                parentPhone: student.parentPhone,
                parent_language: student.parent_language,
                subjects: {},
                cie: {}
            };

            for (const course of courses) {
                console.log(`[HOD STUDENTS] Fetching attendance for student ${student.id}, course ${course.id}`);
                const { data: attendances, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('courseId', course.id);

                if (attendanceError) {
                    console.error(attendanceError.message);
                    return res.status(500).send('Server Error');
                }

                const percent = calculateAttendancePercent(attendances, student.id);
                studentStats.subjects[course.subject] = percent;
                studentStats.cie[course.subject] = {
                    cie1: calculateAttendancePercent(attendances, student.id, cie1Date || null),
                    cie2: calculateAttendancePercent(attendances, student.id, cie2Date || null),
                    overall: percent
                };
            }
            result.push(studentStats);
        }

        console.log('[HOD STUDENTS] BEFORE RESPONSE');
        res.json({ courses, students: result });
        console.log('[HOD STUDENTS] RESPONSE SENT');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/hod/student/language
// @desc    Update student's parent language
router.put('/student/language', auth('hod'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { studentId, language } = req.body;

    try {
        const { error } = await supabase
            .from('users')
            .update({ parent_language: language })
            .eq('id', studentId);

        if (error) {
            console.error(error.message);
            return res.status(500).json({ msg: 'Database update failed' });
        }

        res.json({ msg: 'Language updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
