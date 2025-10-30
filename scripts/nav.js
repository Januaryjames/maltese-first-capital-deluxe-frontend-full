
// nav.js v16 — highlight active link
document.documentElement.classList.add('nojs');
(function() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if ((href === 'index.html' && path === 'index.html') || path === href) {
      a.classList.add('active');
    }
  });
})();
