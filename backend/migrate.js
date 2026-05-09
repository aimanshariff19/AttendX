const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    console.log("🚀 Starting migration...");
    
    // We can't run ALTER TABLE directly via supabase-js easily without a function
    // But we can try to use RPC if we have one or just use a dummy query to check connection
    // For schema changes, it's best to use the Supabase SQL Editor, but I will try to use the 
    // postgres connection if available.
    
    // Since I don't have psql, I'll provide a SQL snippet for the user to run in the Supabase Dashboard
    // OR I can use a raw SQL execution if I set up an RPC function.
    
    console.log("Please run the following SQL in your Supabase SQL Editor:");
    console.log("ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_language text DEFAULT 'English';");
}

migrate();
