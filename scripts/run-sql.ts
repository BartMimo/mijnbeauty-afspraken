import fs from 'fs/promises';
import dotenv from 'dotenv';
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
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: ts-node scripts/run-sql.ts <sql-file-path>');
    process.exit(1);
  }
  const sql = await fs.readFile(file, 'utf-8');
  console.log('Running SQL from', file);
  // Attempt to run via RPC `sql` if available
  try {
    const { data, error } = await (supabase as any).rpc('sql', { q: sql });
    if (error) {
      console.error('RPC error:', error);
      process.exit(1);
    }
    console.log('RPC executed ok:', data);
  } catch (e) {
    console.error('RPC execution failed, trying via query on DB (may not be supported).', (e as any).message || e);
    // If rpc not available, try calling the SQL via the Postgres query endpoint (not always possible)
    try {
      const res = await (supabase as any).postgrest.rpc('sql', { q: sql });
      console.log('Postgrest rpc result:', res);
    } catch (err) {
      console.error('All methods to run SQL failed. Please run the SQL file manually in Supabase SQL editor:', file);
      process.exit(1);
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });