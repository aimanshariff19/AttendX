const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'SET' : 'NOT SET');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Warning: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Supabase queries will fail.');
    module.exports = null;
    return;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false
    }
});

module.exports = supabase;
