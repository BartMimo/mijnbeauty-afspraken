import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Environment variables SUPABASE_URL and SUPABASE_KEY (service key) must be set to run this import script');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function main() {
  const csvPath = path.join(__dirname, '..', 'locations.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('locations.csv not found at', csvPath);
    process.exit(1);
  }

  const txt = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(txt, { skip_empty_lines: true, trim: true });

  // Expect rows: city, postcode, lat, lon, province
  const rows = records
    .map((r: any[]) => ({ city: r[0], postcode: r[1], latitude: parseFloat(r[2]), longitude: parseFloat(r[3]), province: r[4] || null }))
    .filter((r: any) => r.city && r.postcode && !Number.isNaN(r.latitude) && !Number.isNaN(r.longitude));

  console.log(`Parsed ${rows.length} locations from CSV`);

  // Upsert in batches
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`Upserting batch ${i / batchSize + 1} (${batch.length} rows)`);
    const { data, error } = await supabase
      .from('locations')
      .upsert(batch, { onConflict: ['postcode', 'city'] });

    if (error) {
      console.error('Upsert error:', error);
      // Try fallback: insert where not exists
      for (const r of batch) {
        try {
          const { data: ins, error: insErr } = await supabase
            .from('locations')
            .insert(r)
            .select('id');

          if (insErr) {
            // might be duplicate or other constraint; log and continue
            console.error('Insert row failed for', r.postcode, r.city, insErr.message || insErr);
            continue;
          }
          inserted += (ins || []).length;
        } catch (e) {
          console.error('Insert exception for', r.postcode, r.city, e);
        }
      }
    } else {
      inserted += (data || []).length;
    }
  }

  console.log(`Done. Upserted/inserted approximately ${inserted} rows.`);
}

main().catch(err => {
  console.error('Import failed', err);
  process.exit(1);
});
