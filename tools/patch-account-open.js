// tools/patch-account-open.js
// Idempotently injects the wiring scripts into account-open.html without altering visuals.
const fs = require('fs');

const FILE = 'account-open.html';
if (!fs.existsSync(FILE)) {
  console.error('account-open.html not found in this directory.');
  process.exit(1);
}

let html = fs.readFileSync(FILE, 'utf8');

const TAGS = [
  '<script src="/scripts/config.js"></script>',
  '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>',
  '<script src="/scripts/kyc-validate.js" defer></script>',
  '<script src="/scripts/account-open-wire.js" defer></script>'
];

let changed = false;
for (const tag of TAGS) {
  if (!html.includes(tag)) {
    if (/<\/body\s*>/i.test(html)) {
      html = html.replace(/<\/body\s*>/i, `\n${tag}\n</body>`);
      changed = true;
      console.log(`+ injected: ${tag}`);
    } else {
      // fallback: append to end if malformed HTML
      html += `\n${tag}\n`;
      changed = true;
      console.log(`+ appended (no </body> found): ${tag}`);
    }
  } else {
    console.log(`✓ already present: ${tag}`);
  }
}

if (changed) {
  fs.writeFileSync(FILE, html, 'utf8');
  console.log('Done. account-open.html updated.');
} else {
  console.log('No changes needed.');
}
