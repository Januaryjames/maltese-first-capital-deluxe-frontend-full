// tools/insert-legal-footer.js
// Auto-inject visible legal links into footers across the site.
// Safe to run multiple times. No CSS changes. Falls back to before </body> if no <footer> exists.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LEGAL_HTML = `
  <div class="legal-links" aria-label="Legal">
    <a href="/privacy.html">Privacy</a> ·
    <a href="/terms.html">Terms</a> ·
    <a href="/cookies.html">Cookies</a> ·
    <a href="/gdpr.html">GDPR</a>
  </div>
`.trim();

function getAllHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip build/node_modules-ish dirs if present
      if (['node_modules', 'dist', 'build', '.git'].includes(entry.name)) continue;
      getAllHtml(p, acc);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      acc.push(p);
    }
  }
  return acc;
}

function alreadyHasLinks(html) {
  return html.includes('class="legal-links"') || html.includes('/privacy.html');
}

function inject(html) {
  if (alreadyHasLinks(html)) return { html, changed: false };

  // Inside existing <footer> if present
  if (/<\/footer\s*>/i.test(html)) {
    const out = html.replace(/<\/footer\s*>/i, `\n  ${LEGAL_HTML}\n</footer>`);
    return { html: out, changed: true };
  }

  // Otherwise inject a minimal footer before </body>
  if (/<\/body\s*>/i.test(html)) {
    const out = html.replace(/<\/body\s*>/i, `\n<footer>\n  ${LEGAL_HTML}\n</footer>\n</body>`);
    return { html: out, changed: true };
  }

  // If page is malformed, do nothing
  return { html, changed: false };
}

function main() {
  const files = getAllHtml(ROOT);
  let changedCount = 0;

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const { html: next, changed } = inject(html);
    if (changed) {
      fs.writeFileSync(file, next, 'utf8');
      console.log(`+ legal links -> ${path.relative(ROOT, file)}`);
      changedCount++;
    } else {
      console.log(`✓ already has links: ${path.relative(ROOT, file)}`);
    }
  }

  if (!changedCount) {
    console.log('No changes needed. All pages already wired.');
  } else {
    console.log(`Done. Updated ${changedCount} file(s).`);
  }
}

main();
