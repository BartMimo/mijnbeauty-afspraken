import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}
const supabase = createClient(url, key);

(async function () {
  try {
    const { data, error } = await supabase.from('salons').select('id, name, opening_hours').limit(5);
    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }
    console.log('Salons with opening_hours:');
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Unexpected error', e);
    process.exit(1);
  }
})();