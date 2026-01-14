Cimport dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching salons with missing owner_id...');
  const { data: salons } = await supabase.from('salons').select('id, email, name').is('owner_id', null).limit(1000);
  for (const s of (salons as any[]) || []) {
    if (!s.email) {
      console.log(`Skipping salon ${s.id} (${s.name}) — no email`);
      continue;
    }
    const email = s.email;
    // Check if auth user exists
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers?.({ limit: 100 }).catch(() => ({ data: null }));
    // Better approach: try to fetch profile by email in profiles table
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (profile && profile.id) {
      console.log(`Profile exists for ${email}: ${profile.id}, updating salon`);
      await supabase.from('salons').update({ owner_id: profile.id }).eq('id', s.id);
      continue;
    }

    // Create auth user
    console.log(`Creating auth user for ${email}`);
    try {
      const createRes = await supabase.auth.admin.createUser?.({
        email,
        user_metadata: { full_name: s.name + ' owner' }
      });
      if (!createRes) {
        console.error('Auth admin createUser API not available');
        continue;
      }
      const newUser = (createRes as any).data?.user || (createRes as any).user;
      const userId = newUser?.id;
      if (!userId) {
        console.error('No user id returned when creating auth user for', email);
        continue;
      }
      console.log('Created auth user', userId);
      // Create profile row
      const { error: pErr } = await supabase.from('profiles').insert({ id: userId, email, full_name: s.name + ' owner' });
      if (pErr) {
        console.error('Failed to create profile for', email, pErr);
      } else {
        console.log('Created profile for', email);
      }
      // Update salon
      const { error: updErr } = await supabase.from('salons').update({ owner_id: userId }).eq('id', s.id);
      if (updErr) {
        console.error('Failed to update salon owner_id for', s.id, updErr);
      } else {
        console.log(`Linked salon ${s.id} -> owner ${userId}`);
      }
    } catch (err) {
      console.error('Failed to create auth user for', email, err);
    }
  }
  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });