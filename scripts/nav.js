<script>
/* Mobile menu toggle + active link highlighting */
(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  // build mobile menu once if not present
  let mobile = document.querySelector('.mobile-menu');
  if (!mobile) {
    mobile = document.createElement('div');
    mobile.className = 'mobile-menu';
    mobile.innerHTML = `
      <ul>
        <li><a href="/index.html">Home</a></li>
        <li><a href="/private-banking.html">Private Banking</a></li>
        <li><a href="/wealth-management.html">Wealth Management</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/contact.html">Contact</a></li>
        <div class="menu-divider"></div>
        <li><a href="/client-login.html">Client Login</a></li>
        <li><a href="/admin-login.html">Admin Portal</a></li>
      </ul>`;
    header.appendChild(mobile);
    mobile.style.display = 'none';
  }

  // attach toggle if missing
  let toggle = document.querySelector('.nav-toggle');
  if (!toggle) {
    const bar = document.createElement('button');
    bar.className = 'nav-toggle';
    bar.setAttribute('aria-label','Toggle menu');
    bar.innerHTML = `<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>`;
    const nav = document.querySelector('.navbar');
    if (nav) nav.insertBefore(bar, nav.querySelector('.nav-links'));
    toggle = bar;
  }

  toggle.addEventListener('click', () => {
    mobile.style.display = (mobile.style.display === 'none') ? 'block' : 'none';
  });

  // close on link click (mobile)
  mobile.addEventListener('click', e => {
    if (e.target.tagName === 'A') mobile.style.display = 'none';
  });

  // mark active link
  const path = location.pathname.replace(/\/+$/,'/');
  for (const a of document.querySelectorAll('.nav-links a, .mobile-menu a')) {
    const href = a.getAttribute('href');
    if (!href) continue;
    if (href === path) a.parentElement?.classList?.add('active');
  }
})();
</script>
