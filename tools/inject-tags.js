// tools/inject-tags.js
// Inserts the two script tags right before </body> on target pages.
// Safe to re-run; it won't duplicate tags.

const fs = require('fs');
const path = require('path');

const PAGES = [
  'client-login.html',
  'admin-login.html',
  'account-open.html',
  'contact.html'
];

const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="/scripts/front-wire.js" defer></script>'
];

function inject(file) {
  const fp = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fp)) {
    console.warn(`- Skipping ${file} (not found)`);
    return;
  }
  let html = fs.readFileSync(fp, 'utf8');

  // idempotence: if both tags already exist, skip
  const already = TAGS.every(t => html.includes(t));
  if (already) {
    console.log(`✓ ${file} (already injected)`);
    return;
  }

  const idx = html.lastIndexOf('</body>');
  if (idx === -1) {
    console.warn(`! ${file} has no </body>; appending to end`);
    const content = '\n' + TAGS.join('\n') + '\n';
    fs.writeFileSync(fp, html + content, 'utf8');
    console.log(`+ ${file} (appended)`);
    return;
  }

  const injected = html.slice(0, idx) + '\n' + TAGS.join('\n') + '\n' + html.slice(idx);
  fs.writeFileSync(fp, injected, 'utf8');
  console.log(`+ ${file} (injected)`);
}

console.log('Injecting script tags:');
PAGES.forEach(inject);
console.log('Done.');
