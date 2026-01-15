const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yufuecwkihuesctddawe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZnVlY3draWh1ZXNjdGRkYXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQzODEsImV4cCI6MjA4Mzk2MDM4MX0.W5HLhFIHHkLDvXzx-usUBJGFpHR54gyfNkxs36HnY8g'
);

(async () => {
  console.log('=== TEST 1: Alle salons ===');
  const { data: allSalons, error: e1 } = await supabase.from('salons').select('id, name, slug, subdomain');
  console.log('Salons:', JSON.stringify(allSalons, null, 2));
  console.log('Error:', e1);
  
  console.log('\n=== TEST 2: Zoek op slug beauty-test-studio ===');
  const { data: bySlug, error: e2 } = await supabase.from('salons').select('*').eq('slug', 'beauty-test-studio').maybeSingle();
  console.log('Result:', bySlug ? 'FOUND' : 'NOT FOUND');
  console.log('Error:', e2);
  
  console.log('\n=== TEST 3: Zoek op UUID ===');
  const { data: byUuid, error: e3 } = await supabase.from('salons').select('*').eq('id', 'cfebe19c-80f9-4e81-a87b-7dd42466771a').maybeSingle();
  console.log('Result:', byUuid ? 'FOUND' : 'NOT FOUND');
  console.log('Error:', e3);
})();
