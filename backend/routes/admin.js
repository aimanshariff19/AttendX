const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabase');

function checkSupabase(res) {
    if (!supabase) return res.status(500).json({ msg: 'Supabase is not configured' });
    return null;
}

function clean(value) {
    return String(value || '').trim();
}

router.get('/courses', auth('admin'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { data, error } = await supabase.from('courses').select('*').order('department');
    if (error) return res.status(500).json({ msg: error.message });
    res.json(data || []);
});

router.get('/students', auth('admin'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { department, program, sem, section } = req.query;
    let query = supabase.from('users').select('*').eq('role', 'student');
    if (department) query = query.eq('department', department);
    if (program) query = query.eq('program', program);
    if (sem) query = query.eq('sem', sem);
    if (section) query = query.eq('section', section);

    const { data, error } = await query.order('id');
    if (error) return res.status(500).json({ msg: error.message });
    res.json(data || []);
});

router.post('/students', auth('admin'), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const usn = clean(req.body.usn || req.body.id).toUpperCase();
    const name = clean(req.body.name);
    const department = clean(req.body.department).toUpperCase();
    const program = clean(req.body.program).toUpperCase();
    const sem = clean(req.body.sem);
    const section = clean(req.body.section).toUpperCase();
    const phone = clean(req.body.phone || req.body.mobile);
    const parentPhone = clean(req.body.parentPhone);
    const email = clean(req.body.email) || null;
    const password = clean(req.body.password) || usn;

    if (!usn || !name || !department || !program || !sem || !section) {
        return res.status(400).json({ msg: 'USN, name, department, program, semester and section are required' });
    }

    try {
        const payload = {
            id: usn,
            password: await bcrypt.hash(password, 12),
            name,
            email,
            role: 'student',
            department,
            program,
            sem,
            section,
            phone,
            parentPhone,
            photo: req.body.photo || null,
            facePhoto: req.body.photo || null,
            faceSignature: req.body.faceSignature || null
        };

        let { data, error } = await supabase
            .from('users')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error && /photo|facePhoto|faceSignature|column/i.test(`${error.message} ${error.details} ${error.hint}`)) {
            delete payload.photo;
            delete payload.facePhoto;
            delete payload.faceSignature;
            ({ data, error } = await supabase
                .from('users')
                .upsert(payload, { onConflict: 'id' })
                .select()
                .single());
        }

        if (error) return res.status(500).json({ msg: error.message });
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
