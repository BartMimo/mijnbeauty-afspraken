import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

function run(cmd: string) {
  return new Promise<void>((resolve, reject) => {
    const p = exec(cmd, { env: process.env }, (err, stdout, stderr) => {
      if (err) return reject({ err, stdout, stderr });
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
    p.stdout?.pipe(process.stdout);
    p.stderr?.pipe(process.stderr);
  });
}

async function main() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const files = await fs.readdir(dataDir);
  // import order (recommended)
  const order = ['users', 'salons', 'services', 'appointments', 'deals', 'reviews'];

  for (const table of order) {
    const json = files.find((f) => f.toLowerCase() === `${table}.json`);
    const csv = files.find((f) => f.toLowerCase() === `${table}.csv`);
    const file = json || csv;
    if (!file) continue;
    const filePath = `./data/${file}`;
    const mapFilePath = `./data/mappings/${table}.map.json`;
    const mapPath = await fs.stat(path.resolve(process.cwd(), mapFilePath)).then(() => `--map ${mapFilePath}`).catch(() => '');
    console.log(`Importing ${table} from ${filePath}`);
    // Use upsert on slug (if present) to avoid duplicates
    const cmd = `npm run import-data -- --file ${filePath} --table ${table} --upsert --conflict slug ${mapPath}`;
    try {
      await run(cmd);
      console.log(`Imported ${table} OK`);
    } catch (e: any) {
      console.error(`Failed importing ${table}:`, e.err?.message || e);
      // Continue with next tables but report
    }
  }
}

main().catch((err) => {
  console.error('Import-all failed:', err);
  process.exit(1);
});