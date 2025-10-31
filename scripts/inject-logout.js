// tools/inject-logout.js — adds logout script to dashboards (no duplicates)
const fs = require('fs');

const PAGES = [
  'client-dashboard.html',
  'admin-dashboard.html'
];

const TAG = '<script src="/scripts/logout-wire.js" defer></script>';

for (const file of PAGES) {
  if (!fs.existsSync(file)) { console.log('- skip', file); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes(TAG)) { console.log('✓ already injected', file); continue; }
  const out = html.replace(/<\/body\s*>/i, `\n${TAG}\n</body>`);
  fs.writeFileSync(file, out, 'utf8');
  console.log('+ injected', file);
}
