// scripts/admin-create-client.js
(() => {
  const CFG = (window.__MFC_CONFIG || {});
  const API  = (CFG.API_BASE_URL || '').replace(/\/+$/,'');
  const $ = (s, r=document) => r.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  function say(msg, ok=false) {
    const box = $('#msg');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card ' + (ok ? 'ok' : 'err');
    box.textContent = msg;
  }

  on(document, 'DOMContentLoaded', () => {
    const form = $('#createForm');
    const tokenInput = $('#adminToken');
    const result = $('#result');
    const kAcc = $('#kAcc');
    const kSta = $('#kSta');

    // pull token from localStorage if admin-login saved it
    try {
      const t = localStorage.getItem('mfc_admin_token');
      if (t && !tokenInput.value) tokenInput.value = t;
    } catch {}

    on(form, 'submit', async (e) => {
      e.preventDefault();
      if (!API) return say('API_BASE_URL missing in scripts/config.js');

      const adminToken = (tokenInput.value || '').trim();
      if (!adminToken) return say('Paste your admin token from admin-login.html');

      const fd = new FormData(form);
      const body = {
        email: fd.get('email'),
        password: fd.get('password'),
        name: fd.get('name') || '',
        currency: fd.get('currency') || 'USD',
        openingBalance: Number(fd.get('openingBalance') || 0)
      };

      try {
        const res = await fetch(API + '/api/admin/create-client', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer ' + adminToken.replace(/^Bearer\s+/i,'')
          },
          body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data && (data.error || data.message) || ('HTTP ' + res.status);
          return say('Create failed: ' + msg);
        }

        // success
        say('Client created successfully.', true);
        result.style.display = 'block';
        kAcc.textContent = data.account?.accountNo || '—';
        kSta.textContent = data.account?.status || '—';

        // remember token for next time
        try { localStorage.setItem('mfc_admin_token', adminToken); } catch {}
      } catch (err) {
        console.error(err);
        say('Network error creating client.');
      }
    });
  });
})();
