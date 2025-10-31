// scripts/logout-wire.js
// Clears JWT when a logout control is clicked. No visual changes.
// Works with any element that has one of:
//  - id="logout"
//  - data-action="logout"
//  - href="#logout"

(() => {
  function hook(el) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      try { localStorage.removeItem('jwt'); } catch {}
      // Send them somewhere sensible:
      location.href = '/client-login.html';
    });
  }

  const q = [
    '#logout',
    '[data-action="logout"]',
    'a[href="#logout"]'
  ].join(',');

  // Hook already present elements
  document.querySelectorAll(q).forEach(hook);

  // Also hook future elements (if nav is injected later)
  const obs = new MutationObserver(() => {
    document.querySelectorAll(q).forEach((el) => {
      if (!el.__mfc_logout_hooked) {
        el.__mfc_logout_hooked = true;
        hook(el);
      }
    });
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
