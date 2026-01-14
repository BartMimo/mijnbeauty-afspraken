import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing keys'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('users').select('id,email,full_name').limit(50);
  if (error) { console.error(error); process.exit(1); }
  console.table(data);
})();