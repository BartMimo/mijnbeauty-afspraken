import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yufuecwkihuesctddawe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZnVlY3draWh1ZXNjdGRkYXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQzODEsImV4cCI6MjA4Mzk2MDM4MX0.W5HLhFIHHkLDvXzx-usUBJGFpHR54gyfNkxs36HnY8g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('Checking Supabase connection...\n');

    // Check salons table
    const { data: salons, error: salonError } = await supabase
      .from('salons')
      .select('id, name, city')
      .limit(5);
    
    console.log('Salons:', salons?.length || 0, 'records');
    if (salons) console.log(salons);
    if (salonError) console.error('Error:', salonError.message);

    // Check users table
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    console.log('\nUsers:', users?.length || 0, 'records');
    if (users) console.log(users);
    if (userError) console.error('Error:', userError.message);

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkDatabase();
