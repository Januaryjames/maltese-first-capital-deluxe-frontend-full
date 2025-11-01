// scripts/account-open-wire.js (v7)
// Robust submit: uses AJAX; on network error falls back to native form.submit().
// No visual changes.

(() => {
  const CFG = window.__MF_CONFIG || {};
  const BASE = (CFG.API_BASE_URL || "").replace(/\/+$/,"");
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";
  const MAX = 16 * 1024 * 1024;
  const OK = new Set(['application/pdf','image/jpeg','image/png','image/webp']);

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

  function formEl(){
    return document.getElementById('accountOpenForm') || document.querySelector('form');
  }
  function candidateButtons(form){
    const sel = [
      'button[type="submit"]','input[type="submit"]','#submitBtn',
      'button[id*="submit" i]','button[name*="submit" i]','[role="button"][id*="submit" i]'
    ].join(',');
    const set = new Set();
    form.querySelectorAll(sel).forEach(b => set.add(b));
    form.parentElement?.querySelectorAll(sel).forEach(b => set.add(b));
    return Array.from(set);
  }
  function setBusy(form, on){
    candidateButtons(form).forEach(b => { b.disabled = !!on; b.setAttribute('aria-busy', on?'true':'false'); });
  }
  function invalidFilesMsg(form){
    const inputs = form.querySelectorAll('input[type="file"]');
    for (const inp of inputs) for (const f of (inp.files || [])) {
      if (!OK.has(f.type)) return `Unsupported file: ${f.name || ''}. Use PDF/JPG/PNG/WEBP.`;
      if (f.size > MAX) return `${f.name || 'A file'} exceeds 16MB.`;
    }
    return "";
  }

  // Map your input names to backend keys
  function normalizeInto(fd, form){
    const tmap = [
      { to:'fullName',    from:['fullName','authorized_person','authorised_person','name'] },
      { to:'email',       from:['email'] },
      { to:'phone',       from:['phone'] },
      { to:'companyName', from:['company_name','company','account_name'] },
      { to:'country',     from:['country'] }
    ];
    for (const m of tmap){
      if (!fd.get(m.to)) for (const k of m.from){ const v = fd.get(k); if (v){ fd.set(m.to, v); break; } }
    }
    // Files
    const appendAll = (to, names) => {
      names.forEach(n => {
        const input = form.querySelector(`input[type="file"][name="${n}"]`);
        if (input && input.files) for (const f of input.files) fd.append(to, f);
      });
    };
    appendAll('companyDocs',    ['docs_corporate','companyDocs','corporateDocs','docs_sof']);
    appendAll('passport',       ['docs_id','passport']);
    appendAll('proofOfAddress', ['docs_poa','proofOfAddress']);
    appendAll('selfie',         ['selfie_file','selfie']);
    return fd;
  }

  async function postWithFallback(fd){
    const urls = [
      `${BASE}/api/onboarding/account-open`,
      `${BASE}/api/onboarding/submit`
    ].map(u => u.replace(/([^:]\/)\/+/g,'$1'));

    const send = async url => {
      const res = await fetch(url, { method: 'POST', body: fd });
      const txt = await res.text(); let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
      return { res, data };
    };

    let r = await send(urls[0]);
    if (r.res.status === 404 || r.res.status === 405) r = await send(urls[1]);
    return r;
  }

  function bind(){
    const form = formEl(); if (!form || form.dataset.mfcWired === '1') return;
    form.dataset.mfcWired = '1';

    const handle = async (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }

      // Native validation prompts
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        form.reportValidity?.(); return;
      }

      const bad = invalidFilesMsg(form); if (bad) return alert(bad);

      // If BASE missing, fall back instantly to native submit (uses form action)
      if (!BASE) { form.submit(); return; }

      try {
        setBusy(form, true);
        let fd = new FormData(form);
        fd = normalizeInto(fd, form);

        const token = await getToken(form);
        if (token) {
          fd.set('cf_turnstile_response', token);
          fd.set('cf-turnstile-response', token);
        }

        const { res, data } = await postWithFallback(fd);

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `Submit failed (${res.status})`;
          if (res.status === 400 && /captcha/i.test(msg)) return alert('Captcha failed. Backend TURNSTILE_SECRET missing/invalid.');
          if (res.status === 413) return alert('One or more files exceed 16MB.');
          if (res.status === 415) return alert('Unsupported file type. Use PDF/JPG/PNG/WEBP.');
          if (res.status === 404)  return alert('Route 404. Check backend deploy/URL.');
          return alert(msg);
        }

        alert(`Application received. Reference: ${data?.applicationId || 'OK'}`);
        form.reset?.();
      } catch (err) {
        // Hard fallback: native POST to the form action so it still submits
        console.error('[MFC] network error, falling back to native submit', err);
        form.submit();
      } finally {
        setBusy(form, false);
      }
    };

    form.addEventListener('submit', handle, { capture: true });
    const btn = document.getElementById('submitBtn');
    if (btn) btn.addEventListener('click', (e)=>{ e.preventDefault(); handle(e); }, { capture:true });
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', bind)
    : bind();
})();
