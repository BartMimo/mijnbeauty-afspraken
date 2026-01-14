/**
 * scripts/import-data.ts
 * Simple importer that supports JSON and CSV files and inserts into Supabase in batches.
 *
 * Usage (from project root):
 *   npm run import-data -- --file ./data/salons.json --table salons
 *   npm run import-data -- --file ./data/salons.csv --table salons
 *
 * Requirements:
 *   npm i -D ts-node dotenv csv-parse @types/node
 *
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { parse as csvParse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file') out.file = args[++i];
    if (a === '--table') out.table = args[++i];
    if (a === '--batch') out.batch = Number(args[++i]) || 100;
    if (a === '--map') out.map = args[++i];
    if (a === '--upsert') out.upsert = true;
    if (a === '--conflict') out.conflict = args[++i];
  }
  return out;
}

async function loadData(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, 'utf-8');
  if (ext === '.json') {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  if (ext === '.csv') {
    const records = csvParse(raw, { columns: true, skip_empty_lines: true });
    return records;
  }
  throw new Error('Unsupported file format. Use .json or .csv');
}

async function chunkArray(arr: any[], size: number) {
  const chunks = [] as any[];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function main() {
  const args = parseArgs();
  const file = args.file;
  const table = args.table;
  const batch = args.batch || 100;
  const map = args.map;
  if (!file || !table) {
    console.error('Usage: --file <path> --table <tableName> [--batch <size>] [--map <mapfile.json>] [--upsert] [--conflict <col>]');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), file);
  console.log(`Loading file: ${filePath}`);
  let rows = await loadData(filePath);
  console.log(`Loaded ${rows.length} rows.`);

  // Apply optional field mapping (map file maps sourceField -> targetColumn)
  if (map) {
    const mapPath = path.resolve(process.cwd(), map);
    console.log(`Loading mapping: ${mapPath}`);
    const mapRaw = await fs.readFile(mapPath, 'utf-8');
    const mapping = JSON.parse(mapRaw) as Record<string, string>;
    rows = rows.map((row) => {
      const out: Record<string, any> = { ...row };
      for (const [source, target] of Object.entries(mapping)) {
        if (source in row) {
          out[target] = row[source];
          if (target !== source) delete out[source];
        }
      }
      return out;
    });
    console.log('Applied mapping to rows.');
  }

  // Sanitise rows for UUID primary keys: remove incoming `id` so DB generates UUIDs,
  // and remove `owner_id` if value is not a valid UUID (prevents insert errors).
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let removedId = false;
  let removedOwnerId = false;
  rows = rows.map((row) => {
    const out = { ...row } as Record<string, any>;
    if ('id' in out) {
      delete out.id;
      removedId = true;
    }
    if ('owner_id' in out && !uuidRegex.test(String(out.owner_id))) {
      // remove to avoid uuid type errors
      delete out.owner_id;
      removedOwnerId = true;
    }
    return out;
  });
  if (removedId || removedOwnerId) {
    console.log('Sanitised rows before import: removed non-UUID ids to match DB schema.');
    if (removedId) console.log('  - removed incoming `id` fields so DB will generate UUIDs');
    if (removedOwnerId) console.log('  - removed `owner_id` fields that were not valid UUIDs (they can be re-mapped after import)');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || (!supabaseKey && !supabaseServiceKey)) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  // Prefer service role key if provided (needed to bypass RLS during imports).
  // WARNING: service role key is highly privileged; keep it secret and do NOT commit it to source control.
  const supabase = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : createClient(supabaseUrl, supabaseKey);
  if (supabaseServiceKey) console.warn('Using SUPABASE_SERVICE_ROLE_KEY to perform imports (bypasses RLS). Ensure this key is kept secret.');

  // --- Auto-generate `slug` if missing, and ensure uniqueness in the DB ---
  function slugify(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as Record<string, any>;
    if (!r.slug) {
      const base = r.subdomain || r.name || `item-${i + 1}`;
      let candidate = slugify(String(base));
      // ensure not empty
      if (!candidate) candidate = `item-${i + 1}`;
      // ensure uniqueness by checking DB
      let suffix = 0;
      while (true) {
        const trySlug = suffix === 0 ? candidate : `${candidate}-${suffix}`;
        const { data: found, error: findErr } = await supabase.from(table).select('slug').eq('slug', trySlug).limit(1);
        if (findErr) {
          // ignore lookup errors and proceed with current candidate
          break;
        }
        if (!found || found.length === 0) {
          r.slug = trySlug;
          break;
        }
        suffix++;
      }
    }
  }

  // Preflight: check whether the remote table has the columns we will insert
  const sample = rows[0] || {};
  const keys = Object.keys(sample);
  if (keys.length) {
    console.log('Checking remote table columns...');
    const missing: string[] = [];
    for (const key of keys) {
      // Try a single-column select; PostgREST will return an error if the column doesn't exist
      const { error } = await supabase.from(table).select(key).limit(1);
      if (error) {
        missing.push(key);
      }
    }
    if (missing.length) {
      console.error('Import aborted: the following fields were not found as columns in the remote table:');
      console.error('  -', missing.join('\n  - '));
      console.error('\nOptions:');
      console.error('  * Run `supabase/init-schema.sql` in the Dashboard SQL editor to create the expected tables/columns.');
      console.error('  * Or provide a mapping file to rename fields to existing columns:');
      console.error('      npm run import-data -- --file ./data/salons.json --table salons --map ./data/mappings/salons.map.json');
      process.exit(1);
    }
    console.log('All required columns appear to exist in the remote table.');
  }

  const batches = await chunkArray(rows, batch);
  for (let i = 0; i < batches.length; i++) {
    const b = batches[i];
    console.log(`Inserting batch ${i + 1}/${batches.length} (size=${b.length})`);
    let result;
    if (args.upsert) {
      // Use upsert with conflict column if provided (safe for re-runs)
      if (args.conflict) {
        result = await supabase.from(table).upsert(b, { onConflict: args.conflict });
      } else {
        result = await supabase.from(table).upsert(b);
      }
    } else {
      result = await supabase.from(table).insert(b);
    }

    const { error } = result as any;
    if (error) {
      console.error('Error inserting batch:', error);
      // Helpful guidance for common schema mismatch (PGRST204)
      if ((error as any).code === 'PGRST204') {
        console.error('\nIt looks like the target table or some columns are missing in your Supabase database.');
        console.error('Action: open your Supabase project → SQL → New query, paste `supabase/init-schema.sql` from this repo and run it to create the required tables.');
        console.error('Or, add a mapping file to rename incoming fields to existing columns:');
        console.error('  npm run import-data -- --file ./data/salons.json --table salons --map ./data/mappings/salons.map.json');
        console.error('After applying the schema or mapping, re-run this importer.');
      }
      process.exit(1);
    }
  }

  console.log('Import finished successfully.');
}

main().catch((err) => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
