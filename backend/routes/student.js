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

// @route   GET api/student/stats
// @desc    Get attendance stats for logged in student
router.get('/stats', auth('student'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    try {
        const { department, program, sem, section } = req.user;
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .match({ department, program, sem, section });

        if (coursesError) {
            console.error(coursesError.message);
            return res.status(500).send('Server Error');
        }

        const stats = [];

        for (const course of courses) {
            const { data: attendances, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('courseId', course.id);

            if (attendanceError) {
                console.error(attendanceError.message);
                return res.status(500).send('Server Error');
            }

            let conducted = 0;
            let present = 0;

            attendances.forEach(day => {
                const record = (day.records || []).find(r => r.studentId === req.user.id);
                if (record) {
                    conducted += day.numClasses || 1;
                    if (record.status === 'Present') {
                        present += day.numClasses || 1;
                    }
                }
            });

            stats.push({
                subject: course.subject,
                subjectCode: course.subjectCode,
                conducted,
                present,
                absent: conducted - present,
                percent: conducted === 0 ? 100 : Math.round((present / conducted) * 100)
            });
        }

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/student/notifications
// @desc    Get notifications for logged in student
router.get('/notifications', auth('student'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .or(`studentId.eq.${req.user.id},user_id.eq.${req.user.id}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error.message);
            return res.status(500).send('Server Error');
        }

        res.json(notifications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
