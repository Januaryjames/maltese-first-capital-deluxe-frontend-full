// /scripts/nav.js  — v31
(function () {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
  }

  // Add "scrolled" class for subtle header background change
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header && header.classList.toggle('scrolled', y > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active link highlighting (based on pathname)
  const path = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href && path.endsWith(href)) a.parentElement.classList.add('active');
  });
})();
