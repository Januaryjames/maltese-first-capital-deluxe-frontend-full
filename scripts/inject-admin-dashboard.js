// tools/inject-admin-dashboard.js
// Adds config + admin-wire to admin-dashboard.html (no duplicate, no visual change)
const fs = require('fs');
const path = require('path');

const PAGE = path.resolve(process.cwd(), 'admin-dashboard.html');
const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="/scripts/admin-wire.js" defer></script>'
];

function inject(html) {
  const already = TAGS.every(t => html.includes(t));
  if (already) return { html, changed: false };
  const needle = /<\/body\s*>/i;
  if (needle.test(html)) {
    return { html: html.replace(needle, `\n${TAGS.join('\n')}\n</body>`), changed: true };
  }
  return { html: html + '\n' + TAGS.join('\n') + '\n', changed: true };
}

(function main(){
  if (!fs.existsSync(PAGE)) {
    console.error('! admin-dashboard.html not found. Abort.');
    process.exit(1);
  }
  const orig = fs.readFileSync(PAGE,'utf8');
  const { html, changed } = inject(orig);
  if (changed) {
    fs.writeFileSync(PAGE, html, 'utf8');
    console.log('+ Injected tags into admin-dashboard.html');
  } else {
    console.log('✓ Tags already present in admin-dashboard.html');
  }
})();
