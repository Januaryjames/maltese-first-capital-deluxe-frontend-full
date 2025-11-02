// Handles client login and stores JWT
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const form   = document.querySelector('#clientLoginForm') || document.querySelector('form');
    const status = document.querySelector('#loginStatus') || document.createElement('div');
    const submit = document.querySelector('#loginBtn') || form?.querySelector('[type=submit]');

    if (!form) { console.warn('[MFC] No login form found'); return; }
    if (!status.id) { status.id = 'loginStatus'; status.style.marginTop = '8px'; form.appendChild(status); }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = 'Signing in…';
      submit && (submit.disabled = true);
      try {
        const fd = new FormData(form);
        const body = { email: (fd.get('email')||'').trim(), password: fd.get('password')||'' };

        const r = await fetch(MFC.apiBase + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const d = await r.json().catch(()=>({}));
        if (!r.ok || !d.token) throw new Error(d.error || 'Login failed');

        MFC.saveAuth(d.token, d.user);
        const next = new URLSearchParams(location.search).get('next') || '/client-dashboard.html';
        location.href = next;
      } catch (err) {
        status.textContent = String(err.message || err);
      } finally {
        submit && (submit.disabled = false);
      }
    });
  });
})();
