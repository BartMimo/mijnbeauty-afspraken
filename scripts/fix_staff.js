const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async function(){
  try {
    console.log('1) sample roles:');
    console.log(JSON.stringify(await supabase.from('staff').select('role').limit(200), null, 2));

    console.log('\n2) rows with invalid roles (preview):');
    console.log(JSON.stringify(await supabase.from('staff').select('id,role,name,salon_id,user_id').not('role','in.("stylist","therapist","admin")').limit(200), null, 2));

    console.log('\n3) normalize invalid roles -> admin');
    const upd = await supabase.from('staff').update({ role: 'admin' }).not('role','in.("stylist","therapist","admin")').select();
    console.log('update result:', JSON.stringify(upd, null, 2));

    console.log('\n4) strip " Eigenaar" suffix from names (rpc exec_sql)');
    const sql1 = "UPDATE public.staff SET name = regexp_replace(name, '\\s+Eigenaar$', '', 'i') WHERE name ~* '\\s+Eigenaar$';";
    console.log('running:', sql1);
    const res1 = await supabase.rpc('exec_sql', { sql: sql1 });
    console.log('rpc result:', JSON.stringify(res1, null, 2));

    console.log('\n5) backfill name/email from profiles (rpc)');
    const sql2 = "UPDATE public.staff s SET name = p.full_name, email = p.email FROM public.profiles p WHERE s.user_id = p.id AND (s.name IS NULL OR s.name = '');";
    const res2 = await supabase.rpc('exec_sql', { sql: sql2 });
    console.log('rpc result:', JSON.stringify(res2, null, 2));

    console.log('\n6) insert fallback owner entries for salons without staff');
    const sql3 = `INSERT INTO public.staff (id, salon_id, user_id, name, role, created_at)\nSELECT gen_random_uuid(), s.id, s.owner_id, COALESCE(p.full_name, s.name), 'admin', now()\nFROM public.salons s\nLEFT JOIN public.staff st ON st.salon_id = s.id\nLEFT JOIN public.profiles p ON p.id = s.owner_id\nWHERE st.id IS NULL\n  AND s.owner_id IS NOT NULL;`;
    const res3 = await supabase.rpc('exec_sql', { sql: sql3 });
    console.log('rpc result:', JSON.stringify(res3, null, 2));

    console.log('\n7) verify nested selects that previously failed:');
    console.log('deals nested staff(id,name):', JSON.stringify(await supabase.from('deals').select('*, staff:staff_id(id,name)').eq('salon_id','f23be0ce-55a1-45c4-adce-8755fb8bec4b').eq('status','active'), null, 2));
    console.log('staff with is_active filter:', JSON.stringify(await supabase.from('staff').select('id,name,role,is_active').eq('salon_id','f23be0ce-55a1-45c4-adce-8755fb8bec4b').eq('is_active',true), null, 2));

    console.log('\nAll done.');
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();
