import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('salons').select('id, name, slug').limit(10);
  if (error) {
    console.error('Error reading salons:', error);
    process.exit(1);
  }
  console.log(`Found ${data.length} salons (showing up to 10):`);
  console.table(data);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});