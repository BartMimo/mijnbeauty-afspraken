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
    const { data, error, count } = await supabase.from('salons').select('id, name, slug, city, subdomain, owner_id').limit(100);
    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }
    console.log('Found', data?.length ?? 0, 'salons');
    console.log(data?.slice(0, 10));

    const { data: profiles } = await supabase.from('profiles').select('id, email').limit(20);
    console.log('Found', profiles?.length ?? 0, 'profiles sample');
    console.log(profiles?.slice(0, 10));
  } catch (e) {
    console.error('Unexpected error', e);
    process.exit(1);
  }
})();