const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const auth = require('../middleware/auth');

console.log('AUTH ROUTES LOADED');

function checkSupabase(res) {
    if (!supabase) {
        return res.status(500).json({ msg: 'Supabase is not configured' });
    }
    return null;
}

async function passwordMatches(inputPassword, storedPassword) {
    if (!storedPassword) return false;
    const looksHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');
    return looksHashed
        ? await bcrypt.compare(inputPassword, storedPassword)
        : inputPassword === storedPassword;
}

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login attempt:', req.body);
    const err = checkSupabase(res);
    if (err) return err;

    const { id, password, role } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code === 'PGRST116') {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (error) {
            console.error('Supabase error:', error);
            return res.status(400).json({ msg: 'Database error' });
        }

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Compare hashed password
        console.log('Comparing password for user:', user.id);
        try {
            const isMatch = await passwordMatches(password, user.password);
            console.log('Password match result:', isMatch);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }
        } catch (bcryptError) {
            console.error('Bcrypt error:', bcryptError);
            return res.status(500).json({ msg: 'Password verification error' });
        }

        if (role && user.role !== role) {
            return res.status(400).json({ msg: `User is not a ${role}` });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                department: user.department || null,
                program: user.program || null,
                sem: user.sem || null,
                section: user.section || null,
                parentPhone: user.parentPhone || null
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                // Set cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000 // 1 day
                });
                res.json({ user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/logout
// @desc    Logout user and clear cookie
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ msg: 'Logged out successfully' });
});

// @route   PUT api/auth/password
// @desc    Change password for authenticated user
router.put('/password', auth(), async (req, res) => {
    const err = checkSupabase(res);
    if (err) return err;

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ msg: 'Old and new passwords are required' });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, password')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check old password
        const isOldPasswordMatch = await passwordMatches(oldPassword, user.password);
        if (!isOldPasswordMatch) {
            return res.status(400).json({ msg: 'Old password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNewPassword })
            .eq('id', req.user.id);

        if (updateError) {
            console.error(updateError.message);
            return res.status(500).send('Server error');
        }

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/me
// @desc    Get current logged in user
router.get('/me', auth(), (req, res) => {
    res.json(req.user);
});

module.exports = router;
