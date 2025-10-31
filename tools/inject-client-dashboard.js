// tools/inject-client-dashboard.js — add config + client accounts wire
const fs = require('fs');
const PAGE = 'client-dashboard.html';
const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="/scripts/client-accounts-wire.js" defer></script>'
];
if (!fs.existsSync(PAGE)) { console.error('! client-dashboard.html not found'); process.exit(1); }
let html = fs.readFileSync(PAGE, 'utf8');
if (!TAGS.every(t => html.includes(t))) {
  html = html.replace(/<\/body\s*>/i, `\n${TAGS.join('\n')}\n</body>`);
  fs.writeFileSync(PAGE, html, 'utf8'); console.log('+ wired client-dashboard.html');
} else { console.log('✓ already wired'); }
