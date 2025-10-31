// tools/inject-account-open.js
// Inserts the two script tags just before </body> on account-open.html
// No visual changes. Safe to re-run (won’t duplicate).
// Adjust PAGE_PATH if your HTML lives under /public or /dist.

const fs = require('fs');
const path = require('path');

// === CONFIG ===
const PAGE_PATH = path.resolve(process.cwd(), 'account-open.html'); // change to 'public/account-open.html' if needed
const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="/scripts/front-wire.js" defer></script>'
];
// ==============

function inject(html) {
  // If both tags already present, return as-is.
  const already = TAGS.every(t => html.includes(t));
  if (already) return { html, changed: false };

  // Insert right before </body>. If not found, append to end.
  const needle = /<\/body\s*>/i;
  if (needle.test(html)) {
    return {
      html: html.replace(needle, '\n' + TAGS.join('\n') + '\n</body>'),
      changed: true
    };
  } else {
    return { html: html + '\n' + TAGS.join('\n') + '\n', changed: true };
  }
}

(function main() {
  if (!fs.existsSync(PAGE_PATH)) {
    console.error(`! account-open.html not found at: ${PAGE_PATH}`);
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
