const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runMigration() {
  try {
    const sql = fs.readFileSync('combined_migration.sql', 'utf-8');
    console.log('Running combined migration...');

    // Execute the entire SQL as one statement
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration failed:', error.message);
      console.log('Please run the SQL manually in Supabase SQL Editor');
      console.log('SQL content:');
      console.log('===================');
      console.log(sql);
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.log('Please run the combined_migration.sql manually in Supabase SQL Editor');
  }
}

runMigration();