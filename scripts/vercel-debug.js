const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== VERCEL DEBUG START ===');
try {
  const p = 'scripts/create-auth-and-link.ts';
  console.log('\n-- file head (utf8) --');
  const head = fs.readFileSync(p, { encoding: 'utf8' }).split('\n').slice(0, 3).join('\n');
  console.log(head);
  console.log('\n-- file head (hex bytes) --');
  const buf = fs.readFileSync(p);
  console.log(buf.slice(0, 64).toString('hex').match(/.{1,2}/g).join(' '));
  console.log('\n-- stat --');
  console.log(fs.statSync(p));
} catch (e) {
  console.error('Failed to read file:', e && e.message);
}

try {
  console.log('\n-- node version --');
  console.log(process.version);
  console.log('\n-- tsc version --');
  const tsc = execSync('npx tsc -v', { stdio: 'pipe' }).toString();
  console.log(tsc);
} catch (e) {
  console.error('Failed to run tsc -v:', e && e.message);
}
console.log('=== VERCEL DEBUG END ===');
