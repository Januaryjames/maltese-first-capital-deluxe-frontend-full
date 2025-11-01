// scripts/account-open-wire.js (v6)
// Wires the Account Open form to your live backend.
// - Works whether the button is type="button" or "submit"
// - Uses native validation prompts
// - Adds invisible Turnstile token
// - Falls back from /account-open -> /submit if first route 404/405
// - Normalizes file/text field names to match backend expectations
//   Backend expects: passport, proofOfAddress, companyDocs, selfie
(() => {
  const CFG = window.__MF_CONFIG || {};
  const BASE = (CFG.API_BASE_URL || "").replace(/\/+$/,"");
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";
  const MAX = 16 * 1024 * 1024;
  const OK = new Set(['application/pdf','image/jpeg','image/png','image/webp']);

  function log(...a){ try{console.log("[MFC]",...a);}catch{} }

  // --- Turnstile (invisible)
  function loadTurnstile(){
    return new Promise((resolve) => {
      if (window.turnstile) return resolve(window.turnstile);
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true; s.defer = true;
      s.onload = () => resolve(window.turnstile || null);
      document.head.appendChild(s);
    });
  }
  async function getToken(hostEl){
    if (!SITE_KEY) return "";
    await loadTurnstile();
    return new Promise((res) => {
      try{
        const div = document.createElement('div');
        div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
        (hostEl || document.body).appendChild(div);
        const wid = window.turnstile.render(div, { sitekey: SITE_KEY, size: 'invisible', callback: t => res(t) });
        window.turnstile.execute(wid);
      }catch{ res(""); }
    });
  }

  // --- Helpers
  function getForm(){
    return document.getElementById('accountOpenForm') || document.querySelector('form');
  }
  function candidatesAround(form){
    const sel = [
      'button[type="submit"]','input[type="submit"]','#submitBtn',
      'button[id*="submit" i]','button[name*="submit" i]',
      '[role="button"][id*="submit" i]','a.button','a.btn','.btn-primary','.button-primary'
    ].join(',');
    const set = new Set();
    form.querySelectorAll(sel).forEach(b => set.add(b));
    form.parentElement?.querySelectorAll(sel).forEach(b => set.add(b));
    return Array.from(set);
  }
  function setBusy(form, on){
    candidatesAround(form).forEach(b => { b.disabled = !!on; b.setAttribute('aria-busy', on?'true':'false'); });
  }
  function invalidFilesMsg(form){
    const inputs = form.querySelectorAll('input[type="file"]');
    for (const inp of inputs) for (const f of (inp.files || [])) {
      if (!OK.has(f.type)) return `Unsupported file: ${f.name || ''}. Use PDF/JPG/PNG/WEBP.`;
      if (f.size > MAX) return `${f.name || 'A file'} exceeds 16MB.`;
    }
    return "";
  }

  // Map whatever your inputs are called to the canonical keys the backend accepts
  function pickFiles(form, names){
    const files = [];
    names.forEach(n => form.querySelectorAll(`input[type="file"][name="${n}"]`))
      .forEach(list => list.forEach(inp => (inp.files && files.push(...inp.files))));
    return files;
  }
  function normalizeInto(fd, form){
    // --- TEXT FIELDS (canonical: fullName, email, phone, companyName, country)
    const textMap = [
      { to:'fullName',      from:['fullName','authorisedPerson','authorizedPerson','name','contactName'] },
      { to:'email',         from:['email','contactEmail'] },
      { to:'phone',         from:['phone','mobile','tel'] },
      { to:'companyName',   from:['companyName','company','accountName','corporateName'] },
      { to:'country',       from:['country','nation'] }
    ];
    for (const m of textMap){
      if (!fd.get(m.to)) {
        for (const k of m.from){ const v = fd.get(k); if (v){ fd.set(m.to, v); break; } }
      }
    }

    // --- FILE FIELDS
    const addFiles = (key, names) => {
      const chosen = pickFiles(form, names);
      chosen.forEach(f => fd.append(key, f));
    };
    // backend keys
    addFiles('companyDocs',     ['companyDocs','corporateDocs','corporateDocuments','companyDocuments','sourceFunds','sourceOfFunds','wealthEvidence']);
    addFiles('passport',        ['passport','idDocument','authorizedPersonId','authorisedPersonId','authorisedId','id','identity']);
    addFiles('proofOfAddress',  ['proofOfAddress','proofAddress','addressProof','utilityBill']);
    addFiles('selfie',          ['selfie','selfieImage','face','faceImage']);

    return fd;
  }

  async function postWithFallback(fd){
    const urls = [
      `${BASE}/api/onboarding/account-open`,
      `${BASE}/api/onboarding/submit`
    ];
    const clean = (u) => u.replace(/([^:]\/)\/+/g,'$1');
    const tryPost = async (u) => {
      const res = await fetch(clean(u), { method: 'POST', body: fd });
      const txt = await res.text(); let data=null; try{ data = txt ? JSON.parse(txt) : null; } catch { data={raw:txt}; }
      return { res, data };
    };
    const a = await tryPost(urls[0]);
    if (a.res.status !== 404 && a.res.status !== 405) return a;
    return await tryPost(urls[1]);
  }

  function bind(){
    const form = getForm();
    if (!form || form.dataset.mfcWired === '1') return;
    form.dataset.mfcWired = '1';
    log("Account Open wired →", BASE || "(missing API_BASE_URL)");

    const handle = async (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }

      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        form.reportValidity?.();
        return;
      }
      if (!BASE) return alert('Setup: API host not set. Publish scripts/config.js');

      const bad = invalidFilesMsg(form);
      if (bad) return alert(bad);

      try {
        setBusy(form, true);

        // Build FormData and normalize names the backend expects
        let fd = new FormData(form);
        fd = normalizeInto(fd, form);

        // Turnstile token (both field names, backend accepts either)
        const token = await getToken(form);
        if (token) {
          fd.set('cf_turnstile_response', token);
          fd.set('cf-turnstile-response', token);
        }

        const { res, data } = await postWithFallback(fd);

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `Submit failed (${res.status})`;
          if (res.status === 404) return alert('Submit failed (404). Check API_BASE_URL or backend route.');
          if (res.status === 400 && /captcha/i.test(msg)) return alert('Captcha failed. Set TURNSTILE_SECRET on backend.');
          if (res.status === 413) return alert('One or more files exceed 16MB. Reduce size.');
          if (res.status === 415) return alert('Unsupported file type. Use PDF/JPG/PNG/WEBP.');
          return alert(msg);
        }

        alert(`Application received. Reference: ${data?.applicationId || 'OK'}`);
        form.reset?.();
      } catch (err) {
        console.error('[MFC] submit error', err);
        alert('Network error submitting. Check API_BASE_URL in scripts/config.js.');
      } finally {
        setBusy(form, false);
      }
    };

    // Bind submit + common clicks (covers type="button" and anchor-buttons)
    form.addEventListener('submit', handle, { capture: true });
    candidatesAround(form).forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); handle(e); }, { capture: true });
    });
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', bind)
    : bind();
})();
