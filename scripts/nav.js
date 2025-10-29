<!-- /scripts/nav.js -->
<script>
(function(){
  // Build a mobile menu automatically if it's not present
  const header = document.querySelector('header.header');
  if (!header) return;

  const navLinks = header.querySelector('.nav-links');
  const cta      = header.querySelector('.nav-cta');

  let mobile = document.getElementById('mobileMenu');
  if (!mobile) {
    mobile = document.createElement('div');
    mobile.id = 'mobileMenu';
    mobile.className = 'mobile-menu';
    mobile.style.display = 'none';
    const list = document.createElement('ul');

    if (navLinks) {
      // Clone primary nav links
      list.innerHTML = navLinks.innerHTML;
    }

    // Divider + CTAs
    const divider = document.createElement('li');
    divider.className = 'menu-divider';
    list.appendChild(divider);

    // Login CTA
    const liClient = document.createElement('li');
    liClient.innerHTML = `<a href="/client-login.html">Client Login</a>`;
    list.appendChild(liClient);

    // Admin CTA
    const liAdmin = document.createElement('li');
    liAdmin.innerHTML = `<a href="/admin-login.html">Admin Portal</a>`;
    list.appendChild(liAdmin);

    mobile.appendChild(list);
    header.appendChild(mobile);
  }

  // Toggle logic
  const toggle = header.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      mobile.style.display = (mobile.style.display === 'none' || !mobile.style.display) ? 'block' : 'none';
    });
  }

  // Close on link click (mobile)
  mobile.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') mobile.style.display = 'none';
  });

  // Hide menu when resizing up
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (w > 1000 && lastW <= 1000) mobile.style.display = 'none';
    lastW = w;
  });
})();
</script>
