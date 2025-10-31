// Adds <script src="/scripts/auth-guard.js" defer> to selected pages.
const fs = require('fs');
const pages = [
  'client-dashboard.html', 'client-profile.html', 'new-client-profile.html',
  'admin-dashboard.html', 'admin-kyc.html', 'admin-docs.html'
];
const TAG = '<script src="/scripts/auth-guard.js" defer></script>';

for (const f of pages) {
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes(TAG)) { console.log('✓', f); continue; }
  const out = html.replace(/<\/body\s*>/i, `\n${TAG}\n</body>`);
  fs.writeFileSync(f, out, 'utf8');
  console.log('+ injected', f);
}
