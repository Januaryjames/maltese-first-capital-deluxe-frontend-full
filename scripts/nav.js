// nav.js v43 — mobile dropdown + scroll lock + active link helper
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  const openMenu = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });

  // Close on escape or link click
  menu.addEventListener('click', (e) => { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // Active state by path (desktop & mobile)
  const path = location.pathname.replace(/\/+$/, '');
  const markActive = (root) => {
    root.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href').replace(/\/+$/, '');
      if (href && href.length > 1 && href === path) {
        const li = a.closest('li');
        li && li.classList.add('active');
      }
    });
  };
  const desktop = document.querySelector('.nav-links');
  desktop && markActive(desktop);
  markActive(menu);
})();
