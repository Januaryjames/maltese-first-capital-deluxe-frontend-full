// tools/audit-final.js
const fs=require('fs'),path=require('path');
const ROOT=process.cwd();
const PAGES=fs.readdirSync(ROOT).filter(f=>f.endsWith('.html'));
const mustHaveFooter=/class="legal-links"|\/privacy\.html|\/terms\.html|\/cookies\.html|\/gdpr\.html/i;
function read(p){try{return fs.readFileSync(p,'utf8')}catch{return''}}

function checkAccountOpen(html){
  const hasTurnstile=/challenges\.cloudflare\.com\/turnstile/i.test(html);
  const hasKyc=/scripts\/kyc-validate\.js/i.test(html);
  const postsApi=/\/api\//i.test(html);
  return {hasTurnstile,hasKyc,postsApi};
}

let ok=0, bad=0;
for(const file of PAGES){
  const html=read(file);
  const footerOK=mustHaveFooter.test(html);
  const res=[`• ${file}`];

  if(footerOK) res.push('footer-links: OK'); else res.push('footer-links: MISSING');

  if(file==='account-open.html'){
    const a=checkAccountOpen(html);
    res.push(`turnstile:${a.hasTurnstile?'OK':'MISSING'}`,
             `kyc-validate:${a.hasKyc?'OK':'MISSING'}`,
             `api-post:${a.postsApi?'OK':'MISSING'}`);
  }
  console.log(res.join(' | '));
  if(res.some(s=>/MISSING/.test(s))) bad++; else ok++;
}
console.log(`\nSummary → OK: ${ok} | Needs Fix: ${bad}`);
