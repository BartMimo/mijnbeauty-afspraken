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
  const { data: salons, error: salonErr } = await supabase
    .from('salons')
    .select('id, email, name')
    .is('owner_id', null)
    .limit(1000);

  if (salonErr) {
    console.error('Failed to fetch salons:', salonErr);
    process.exit(1);
  }
  if (!salons || salons.length === 0) {
    console.log('No salons need owner linking.');
    return;
  }

  for (const s of salons as any[]) {
    if (!s.email) {
      console.log(`Skipping salon ${s.id} (${s.name}) — no email to link`);
      continue;
    }
    const email = s.email;
    // Find existing user
    const { data: userData } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    let userId: string | null = null;
    if (userData && userData.id) {
      userId = userData.id;
      console.log(`Found existing user ${userId} for ${email}`);
    } else {
      // Create user
      const { data: newUser, error: insertErr } = await supabase.from('users').insert({ email, full_name: s.name + ' owner', role: 'owner' }).select('id').maybeSingle();
      if (insertErr) {
        console.error('Failed to create user for', email, insertErr);
        continue;
      }
      userId = newUser.id;
      console.log(`Created user ${userId} for ${email}`);
    }

    // Update salon
    const { error: updErr } = await supabase.from('salons').update({ owner_id: userId }).eq('id', s.id);
    if (updErr) {
      console.error('Failed to update salon owner_id for', s.id, updErr);
      continue;
    }
    console.log(`Linked salon ${s.id} -> owner ${userId}`);
  }

  console.log('Owner linking completed.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});