// tools/inject-account-open.js
// Inserts the two tags right before </body> on account-open.html (idempotent).

const fs = require('fs');
const path = require('path');

// If your HTML is under /public, change this to 'public/account-open.html'
const PAGE_PATH = path.resolve(process.cwd(), 'account-open.html');

const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="/scripts/front-wire.js" defer></script>'
];

function inject(html) {
  const already = TAGS.every(t => html.includes(t));
  if (already) return { html, changed:false };

  const needle = /<\/body\s*>/i;
  if (needle.test(html)) {
    return { html: html.replace(needle, '\n' + TAGS.join('\n') + '\n</body>'), changed:true };
  }
  return { html: html + '\n' + TAGS.join('\n') + '\n', changed:true };
}

(function main(){
  if (!fs.existsSync(PAGE_PATH)) {
    console.error(`! Not found: ${PAGE_PATH}`);
    process.exit(1);
  }
  const orig = fs.readFileSync(PAGE_PATH, 'utf8');
  const { html, changed } = inject(orig);
  if (changed) {
    fs.writeFileSync(PAGE_PATH, html, 'utf8');
    console.log(`+ Injected tags into ${PAGE_PATH}`);
  } else {
    console.log(`✓ Tags already present in ${PAGE_PATH}`);
  }
})();
