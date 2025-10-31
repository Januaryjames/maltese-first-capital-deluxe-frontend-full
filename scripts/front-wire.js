// scripts/front-wire.js
// Frontend wiring for Maltese First Capital
// - Invisible Turnstile (no UI)
// - Client/Admin login -> JWT + redirect
// - Account Open (KYC multipart -> /api/onboarding/submit)
// - Contact (stubbed alert until /api/contact exists)

(() => {
  const CFG = (window.MFC || {});
  const API = CFG.API_BASE_URL || "";
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

  // ---------- tiny helpers ----------
  function $(sel, root = document) { return root.querySelector(sel); }

  async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem('jwt');
    const headers = Object.assign(
      { Accept: 'application/json' },
      opts.headers || {},
      token ? { Authorization: `Bearer ${token}` } : {}
    );
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  // ---------- Turnstile (invisible) ----------
  function loadTurnstile() {
    if (!SITE_KEY) return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true; s.defer = true;
      s.onload = () => resolve(window.turnstile || null);
      document.head.appendChild(s);
    });
  }

  async function attachInvisibleTurnstile(form) {
    if (!SITE_KEY) return { exec: async () => "", reset: () => {} };
    await loadTurnstile();

    // hidden holder (no layout impact)
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    form.appendChild(holder);

    let hidden = form.querySelector('input[name="cf_turnstile_response"]');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'cf_turnstile_response';
      form.appendChild(hidden);
    }

    const wid = window.turnstile.render(holder, {
      sitekey: SITE_KEY,
      size: 'invisible',
      callback: function (token) {
        hidden.value = token;
        pendingResolve && pendingResolve(token);
        pendingResolve = null;
      }
    });

    let pendingResolve = null;
    return {
      exec: () => new Promise(resolve => {
        pendingResolve = resolve;
        try { window.turnstile.execute(wid); } catch { resolve(""); }
      }),
      reset: () => { try { window.turnstile.reset(wid); } catch {} hidden.value = ""; }
    };
  }

  // ---------- form finders (robust, no ID changes needed) ----------
  function findClientLoginForm() {
    const byId = $('#client-login-form'); if (byId) return byId;
    const f = $('form'); if (!f) return null;
    const e = f.querySelector('input[type="email"], input[name*="email" i]');
    const p = f.querySelector('input[type="password"], input[name*="password" i]');
    return (e && p && /client|login/i.test(document.body.innerText)) ? f : null;
  }
  function findAdminLoginForm() {
    const byId = $('#admin-login-form'); if (byId) return byId;
    const f = $('form'); if (!f) return null;
    const e = f.querySelector('input[type="email"], input[name*="email" i]');
    const p = f.querySelector('input[type="password"], input[name*="password" i]');
    return (e && p && /admin/i.test(document.body.innerText)) ? f : null;
  }
  function findOnboardingForm() {
    const byId = $('#onboarding-form'); if (byId) return byId;
    const forms = Array.from(document.querySelectorAll('form'));
    // pick a form with file inputs (KYC) or multiple sections
    return forms.find(ff => ff.querySelector('input[type="file"]')) || null;
  }
  function findContactForm() {
    const byId = $('#contact-form'); if (byId) return byId;
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.find(ff => ff.querySelector('textarea')) || null;
  }

  // ---------- bind: Client Login ----------
  (async () => {
    const form = findClientLoginForm(); if (!form) return;
    const emailEl = form.querySelector('input[type="email"], input[name*="email" i]');
    const passEl  = form.querySelector('input[type="password"], input[name*="password" i]');
    const ts = await attachInvisibleTurnstile(form); // optional on login

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        // await ts.exec(); // enable if you decide to protect login too
        const email = (emailEl && emailEl.value || '').trim();
        const password = passEl && passEl.value || '';
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt', data.token);
        window.location.href = '/client-dashboard.html';
      } catch (err) { alert(err.message); }
      finally { ts.reset && ts.reset(); }
    });
  })();

  // ---------- bind: Admin Login ----------
  (async () => {
    const form = findAdminLoginForm(); if (!form) return;
    const emailEl = form.querySelector('input[type="email"], input[name*="email" i]');
    const passEl  = form.querySelector('input[type="password"], input[name*="password" i]');
    const ts = await attachInvisibleTurnstile(form); // optional on login

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        // await ts.exec();
        const email = (emailEl && emailEl.value || '').trim();
        const password = passEl && passEl.value || '';
        const data = await apiFetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt', data.token);
        window.location.href = '/admin-dashboard.html';
      } catch (err) { alert(err.message); }
      finally { ts.reset && ts.reset(); }
    });
  })();

  // ---------- bind: Account Open (KYC) ----------
  (async () => {
    const form = findOnboardingForm(); if (!form) return;
    const ts = await attachInvisibleTurnstile(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const token = await ts.exec();
        if (!token) throw new Error('Captcha verification failed — please retry.');
        const fd = new FormData(form); // includes cf_turnstile_response
        const data = await apiFetch('/api/onboarding/submit', { method: 'POST', body: fd });
        alert(`Application received. ID: ${data.applicationId}`);
        form.reset(); ts.reset();
      } catch (err) { alert(err.message); }
    });
  })();

  // ---------- bind: Contact (stub) ----------
  (async () => {
    const form = findContactForm(); if (!form) return;
    const ts = await attachInvisibleTurnstile(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await ts.exec();
        alert('Thanks—your message has been noted.');
        form.reset(); ts.reset();
        // When you add /api/contact: post FormData here with apiFetch('/api/contact', { method:'POST', body: fd })
      } catch (err) { alert(err.message); }
    });
  })();

  // ---------- optional: hydrate client dashboard ----------
  (() => {
    if (!/client-dashboard\.html/i.test(location.pathname)) return;
    const pre = document.querySelector('#accounts, pre#accounts');
    if (!pre) return;
    apiFetch('/api/client/overview').then(
      d => { try { pre.textContent = JSON.stringify(d.accounts, null, 2); } catch {} },
      e => alert(e.message)
    );
  })();

})();
