// scripts/front-wire.js
(() => {
  const CFG = (window.MFC || {});
  const API = CFG.API_BASE_URL || "";
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

  function $(sel, root=document){ return root.querySelector(sel); }
  function pathIs(rx){ return rx.test(location.pathname); }

  async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem('jwt');
    const headers = Object.assign(
      { Accept: 'application/json' },
      opts.headers || {},
      token ? { Authorization: `Bearer ${token}` } : {}
    );
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch { data = { raw:text }; }
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  // ---- Turnstile (invisible) ----
  function loadTurnstile(){
    if (!SITE_KEY) return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src='https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async=true; s.defer=true; s.onload=()=>resolve(window.turnstile||null);
      document.head.appendChild(s);
    });
  }
  async function attachInvisibleTurnstile(form){
    if (!SITE_KEY) return { exec: async()=>"", reset: ()=>{} };
    await loadTurnstile();
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    form.appendChild(holder);
    let hidden = form.querySelector('input[name="cf_turnstile_response"]');
    if (!hidden) { hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='cf_turnstile_response'; form.appendChild(hidden); }
    const wid = window.turnstile.render(holder, {
      sitekey: SITE_KEY, size: 'invisible',
      callback: (token)=>{ hidden.value = token; pending && pending(token); pending=null; }
    });
    let pending = null;
    return {
      exec: () => new Promise(resolve => { pending = resolve; try { window.turnstile.execute(wid); } catch { resolve(""); } }),
      reset: () => { try { window.turnstile.reset(wid); } catch {} hidden.value=""; }
    };
  }

  // ---- Finders (no DOM edits) ----
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
    return forms.find(ff => ff.querySelector('input[type="file"]')) || null;
  }
  function findContactForm() {
    const byId = $('#contact-form'); if (byId) return byId;
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.find(ff => ff.querySelector('textarea')) || null;
  }

  // ---- Client Login ----
  (async () => {
    const form = findClientLoginForm(); if (!form) return;
    const emailEl = form.querySelector('input[type="email"], input[name*="email" i]');
    const passEl  = form.querySelector('input[type="password"], input[name*="password" i]');
    const ts = await attachInvisibleTurnstile(form); // keep optional
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        // await ts.exec();
        const email = (emailEl && emailEl.value || '').trim();
        const password = passEl && passEl.value || '';
        const data = await apiFetch('/api/auth/login', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt', data.token);
        location.href = '/client-dashboard.html';
      }catch(err){ alert(err.message); }
      finally { ts.reset && ts.reset(); }
    });
  })();

  // ---- Admin Login ----
  (async () => {
    const form = findAdminLoginForm(); if (!form) return;
    const emailEl = form.querySelector('input[type="email"], input[name*="email" i]');
    const passEl  = form.querySelector('input[type="password"], input[name*="password" i]');
    const ts = await attachInvisibleTurnstile(form);
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        // await ts.exec();
        const email = (emailEl && emailEl.value || '').trim();
        const password = passEl && passEl.value || '';
        const data = await apiFetch('/api/admin/login', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt', data.token);
        location.href = '/admin-dashboard.html';
      }catch(err){ alert(err.message); }
      finally { ts.reset && ts.reset(); }
    });
  })();

  // ---- Account Open (KYC) ----
  (async () => {
    const form = findOnboardingForm(); if (!form) return;
    const ts = await attachInvisibleTurnstile(form);

    const findTextLike = (keywords) => {
      const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, input:not([type])');
      const rx = new RegExp(keywords.join('|'), 'i');
      for (const el of inputs) {
        const name = (el.name||''); const ph = (el.placeholder||'');
        const id = el.id ? `#${el.id}` : '';
        const lbl = el.id ? (form.querySelector(`label[for="${el.id}"]`)?.textContent||'') : '';
        const ctx = [name, ph, lbl, id].join(' ');
        if (rx.test(ctx)) return el;
      }
      return null;
    };
    const findCountry = () => {
      const selects = Array.from(form.querySelectorAll('select'));
      return selects.find(s => /country/i.test((s.name||"") + " " + (s.id||"") + " " + (s.closest('label')?.textContent||""))) || selects[0] || null;
    };

    const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        const token = await ts.exec();
        if (!token) throw new Error('Captcha verification failed — please retry.');

        const fd = new FormData();
        fd.append('cf_turnstile_response', token);

        const companyNameEl = findTextLike(['company','account name']);
        const authorisedEl  = findTextLike(['authorised person','authorized person','full name','name']);
        const emailEl       = findTextLike(['email']);
        const phoneEl       = findTextLike(['phone','mobile','tel']);
        const countryEl     = findCountry();

        if (companyNameEl) fd.append('companyName', companyNameEl.value || '');
        if (authorisedEl)  fd.append('fullName', authorisedEl.value || '');
        if (emailEl)       fd.append('email', (emailEl.value||'').trim());
        if (phoneEl)       fd.append('phone', phoneEl.value || '');
        if (countryEl)     fd.append('country', (countryEl.value||'').trim());

        const bucketByLabel = (input) => {
          const lbl = input.id ? (form.querySelector(`label[for="${input.id}"]`)?.textContent||'') : (input.closest('label')?.textContent||'');
          const text = (lbl||'').toLowerCase();
          if (text.includes('passport') || text.includes('id')) return 'passport';
          if (text.includes('proof of address')) return 'proofOfAddress';
          if (text.includes('corporate') || text.includes('company') || text.includes('source of')) return 'companyDocs';
          return null;
        };
        const buckets = { passport: [], proofOfAddress: [], companyDocs: [], selfie: [] };
        fileInputs.forEach((inp, idx)=>{
          const target = bucketByLabel(inp) || (idx===0 ? 'companyDocs' : idx===1 ? 'passport' : idx===2 ? 'proofOfAddress' : 'companyDocs');
          const files = Array.from(inp.files||[]);
          files.forEach(f => buckets[target].push(f));
        });
        for (const f of buckets.companyDocs)   fd.append('companyDocs', f, f.name);
        for (const f of buckets.passport)      fd.append('passport', f, f.name);
        for (const f of buckets.proofOfAddress)fd.append('proofOfAddress', f, f.name);
        for (const f of buckets.selfie)        fd.append('selfie', f, f.name);

        const data = await apiFetch('/api/onboarding/submit', { method:'POST', body: fd });
        alert(`Application received.\nID: ${data.applicationId}`);
        try { form.reset(); } catch {}
        ts.reset && ts.reset();
      }catch(err){
        alert(err.message || 'Submission failed');
        ts.reset && ts.reset();
      }
    });
  })();

  // ---- Contact (posts to /api/contact) ----
  (async () => {
    const form = findContactForm(); if (!form) return;
    const ts = await attachInvisibleTurnstile(form);
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        const token = await ts.exec();
        if (!token) throw new Error('Captcha verification failed — please retry.');
        const fd = new FormData(form);
        fd.append('cf_turnstile_response', token);
        await apiFetch('/api/contact', { method:'POST', body: fd });
        alert('Thanks — your message has been received.');
        form.reset(); ts.reset();
      }catch(err){ alert(err.message); ts.reset && ts.reset(); }
    });
  })();

  // ---- Client Dashboard hydrate (no CSS changes; optional) ----
  (() => {
    if (!/client-dashboard\.html/i.test(location.pathname)) return;
    const pre = document.querySelector('#accounts, pre#accounts');
    if (!pre) return;
    apiFetch('/api/client/overview').then(
      d => { try { pre.textContent = JSON.stringify(d.accounts || [], null, 2); } catch {} },
      e => console.error(e.message)
    );
  })();

  // ---- Reset Password page wiring ----
  (function resetPasswordWiring(){
    if (!pathIs(/\/reset-password\.html$/i)) return;

    // 1) Request reset code
    const reqForm = $('#request-reset-form');
    if (reqForm) {
      reqForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        try{
          const email = (new FormData(reqForm).get('email') || '').toString().trim();
          if (!email) throw new Error('Email is required');
          await apiFetch('/api/auth/request-reset', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ email })
          });
          alert('If that email exists, a reset code has been generated.\nCheck your inbox (or ask ops to provide the code).');
          reqForm.reset();
        }catch(err){ alert(err.message); }
      });
    }

    // 2) Confirm reset with code
    const confForm = $('#confirm-reset-form');
    if (confForm) {
      confForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        try{
          const fd = new FormData(confForm);
          const token = (fd.get('token') || '').toString().trim();
          const newPassword = (fd.get('newPassword') || '').toString();
          const confirmPassword = (fd.get('confirmPassword') || '').toString();
          if (!token) throw new Error('Reset code is required');
          if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
          if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

          await apiFetch('/api/auth/reset', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ token, newPassword })
          });
          alert('Password updated. You can sign in now.');
          confForm.reset();
          location.href = '/client-login.html';
        }catch(err){ alert(err.message); }
      });
    }
  })();
})();
