// tools/inject-legal-links.js
// Adds discreet legal links into existing <footer> and injects cookie-consent.js on pages.
// No CSS changes. Safe to run multiple times.

const fs = require('fs');

const PAGES = [
  'index.html','about.html','private-banking.html','wealth-management.html',
  'contact.html','client-login.html','admin-login.html',
  'account-open.html','password-reset.html','reset-password.html',
  'client-dashboard.html','admin-dashboard.html'
];

const LEGAL = '<div class="legal-links"><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="/cookies.html">Cookies</a> · <a href="/gdpr.html">GDPR</a></div>';
const COOKIE_TAG = '<script src="/scripts/cookie-consent.js" defer></script>';

function process(file){
  if (!fs.existsSync(file)) return console.log('skip (missing):', file);
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1) Inject legal links inside existing footer (before </footer>)
  if (html.match(/<\/footer\s*>/i) && !html.includes('class="legal-links"') && !html.includes('/privacy.html')) {
    html = html.replace(/<\/footer\s*>/i, `\n  ${LEGAL}\n</footer>`);
    changed = true;
    console.log('+ legal links ->', file);
  }

  // 2) Ensure cookie-consent.js is loaded (once, before </body>)
  if (!html.includes(COOKIE_TAG)) {
    html = html.replace(/<\/body\s*>/i, `\n${COOKIE_TAG}\n</body>`);
    if (!changed) console.log('+ cookie banner ->', file);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html, 'utf8');
  else console.log('✓ already wired:', file);
}

PAGES.forEach(process);
