// v19 — shared header/footer injector
const NAV = `
<header class="site">
  <div class="navbar wrap">
    <a class="brand" href="/index.html">
      <img src="/assets/logo-crest.png" alt="MFC crest"/>
      <span class="name">Maltese First Capital</span>
    </a>
    <nav class="links">
      <a href="/private-banking.html">Private Banking</a>
      <a href="/wealth-management.html">Wealth Management</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
    </nav>
    <div class="actions">
      <a class="btn ghost" href="/client-login.html">Client Login</a>
      <a class="btn gold" href="/admin-login.html">Admin Portal</a>
    </div>
  </div>
</header>`;

const FOOT = `
<footer class="site">
  <div class="wrap" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
    <div>© 2025 Maltese First Capital. All rights reserved.</div>
    <div style="opacity:.8">The Exchange Building, Republic Street, Valletta VLT 1117, Malta •
      <a href="mailto:hello@maltesefirst.com">hello@maltesefirst.com</a>
    </div>
  </div>
</footer>`;

document.addEventListener('DOMContentLoaded',()=>{
  document.body.insertAdjacentHTML('afterbegin', NAV);
  document.body.insertAdjacentHTML('beforeend', FOOT);

  // highlight current nav link
  const here = location.pathname.replace(/\/+$/,'');
  document.querySelectorAll('nav.links a').forEach(a=>{
    const href=a.getAttribute('href'); if(!href) return;
    if(here.endsWith(href)) a.classList.add('active');
  });
});
