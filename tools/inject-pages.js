// tools/inject-pages.js — idempotent injector for multiple pages (no visual changes)
const fs = require('fs');
const path = require('path');

// If your HTML files are under /public, prefix each with 'public/'
const PAGES = [
  'account-open.html',
  'contact.html',
  'client-login.html',
  'admin-login.html'
];

const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="/scripts/front-wire.js" defer></script>'
];

function injectFile(relPath){
  const fp = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fp)) { console.warn(`- Skip (not found): ${relPath}`); return; }
  let html = fs.readFileSync(fp, 'utf8');
  const already = TAGS.every(t => html.includes(t));
  if (already) { console.log(`✓ ${relPath} (already injected)`); return; }
  const needle = /<\/body\s*>/i;
  if (needle.test(html)) {
    html = html.replace(needle, `\n${TAGS.join('\n')}\n</body>`);
  } else {
    html = `${html}\n${TAGS.join('\n')}\n`;
  }
  fs.writeFileSync(fp, html, 'utf8');
  console.log(`+ Injected into ${relPath}`);
}

console.log('Injecting tags…');
PAGES.forEach(injectFile);
console.log('Done.');
