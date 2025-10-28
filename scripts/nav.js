// Simple current-link highlighter + smooth scroll guard
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if ((path === '' && href === 'index.html') || href === path) {
      a.setAttribute('aria-current', 'page');
      a.style.opacity = '1';
      a.style.textDecoration = 'underline';
      a.style.textUnderlineOffset = '6px';
    }
  });
});
