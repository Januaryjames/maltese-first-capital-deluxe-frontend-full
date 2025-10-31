// scripts/front-wire.js
(() => {
  const CFG = (window.MFC || {});
  const API = CFG.API_BASE_URL || "";
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

  function $(sel, root=document){ return root.querySelector(sel); }

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
      sitekey: SITE_KEY,
      size: 'invisible',
      callback: (token)=>{ hidden.value = token; pending && pending(token); pending=null; }
    });

    let pending = null;
    return {
      exec: () => new Promise(resolve => { pending = resolve; try { window.turnstile.execute(wid); } catch { resolve(""); } }),
      reset: () => { try { window.turnstile.reset(wid); } catch {} hidden.value=""; }
    };
  }

  // ---- Account Open binding (robust mapping; no HTML changes) ----
  (async function bindAccountOpen(){
    // Heuristic: pick the first form on /account-open.html (the page title shows "Open an Account")
    const form = document.querySelector('form');
    const pageLooksRight = /Open an Account|KYC|AML/i.test(document.body.innerText || "");
    if (!form || !pageLooksRight) return;

    const ts = await attachInvisibleTurnstile(form);

    // helpers to find fields without changing markup
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
      // prefer a <select> with country options
      const selects = Array.from(form.querySelectorAll('select'));
      return selects.find(s => /country/i.test((s.name||"") + " " + (s.id||"") + " " + (s.closest('label')?.textContent||""))) || selects[0] || null;
    };

    const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        const token = await ts.exec();
        if (!token) throw new Error('Captcha verification failed — please retry.');

        // Build FormData explicitly -> map to backend keys
        const fd = new FormData();

        // Turnstile token
        fd.append('cf_turnstile_response', token);

        // Map text fields (best-effort; no HTML changes)
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

        // Map files -> backend expects: companyDocs[], passport[], proofOfAddress[], selfie[] (optional)
        // Try to detect by nearby label text; fall back to index order shown on the page.
        const bucketByLabel = (input) => {
          const lbl = input.id ? (form.querySelector(`label[for="${input.id}"]`)?.textContent||'') : (input.closest('label')?.textContent||'');
          const text = (lbl||'').toLowerCase();
          if (text.includes('passport') || text.includes('id')) return 'passport';
          if (text.includes('proof of address')) return 'proofOfAddress';
          if (text.includes('corporate') || text.includes('company')) return 'companyDocs';
          if (text.includes('source of funds') || text.includes('wealth')) return 'companyDocs'; // treat as docs
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
        // 'selfie' optional; only append if present
        for (const f of buckets.selfie)        fd.append('selfie', f, f.name);

        // POST to backend
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
})();
