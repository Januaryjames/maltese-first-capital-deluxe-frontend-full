// scripts/legal-footer.js
// Injects visible legal links inside an existing <footer>, or adds a tiny footer if missing.
// No CSS changes; inherits your current styles.
(function(){
  const HTML = `
    <div class="legal-links" aria-label="Legal">
      <a href="/privacy.html">Privacy</a> ·
      <a href="/terms.html">Terms</a> ·
      <a href="/cookies.html">Cookies</a> ·
      <a href="/gdpr.html">GDPR</a>
    </div>
  `.trim();

  function inject(){
    let footer = document.querySelector('footer');
    if (!footer) {
      footer = document.createElement('footer');
      document.body.appendChild(footer);
    }
    if (!footer.querySelector('.legal-links')) {
      footer.insertAdjacentHTML('beforeend', HTML);
    }
  }

  (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', inject) : inject();
})();
