import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching salons with missing owner_id...');
  const { data: salons } = await supabase.from('salons').select('id, email, name').is('owner_id', null).limit(1000);
  for (const s of (salons as any[]) || []) {
    if (!s.email) continue;
    const email = s.email;
    const { data: user } = await supabase.from('users').select('id, email, full_name').eq('email', email).maybeSingle();
    if (!user) {
      console.log(`No user for ${email}; skipping (link-owners should have created one)`);
      continue;
    }
    // Ensure profile exists
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (!profile) {
      const { error: pErr } = await supabase.from('profiles').insert({ id: user.id, email: user.email, full_name: user.full_name });
      if (pErr) {
        console.error('Failed to create profile for', user.id, pErr);
        continue;
      }
      console.log(`Created profile ${user.id}`);
    } else {
      console.log(`Profile exists for ${user.id}`);
    }
    // Now update salon owner_id
    const { error: updErr } = await supabase.from('salons').update({ owner_id: user.id }).eq('id', s.id);
    if (updErr) {
      console.error('Failed to update salon owner_id for', s.id, updErr);
      continue;
    }
    console.log(`Linked salon ${s.id} -> owner ${user.id}`);
  }
  console.log('Fix complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });