// scripts/account-open-wire.js  (v3)
// - Works whether the button is type="button" or type="submit"
// - Posts multipart FormData with Turnstile token
// - Falls back from /account-open -> /submit when 404/405
// - No visual changes

(() => {
  const CFG = (window.__MF_CONFIG || {});
  const BASE = (CFG.API_BASE_URL || "").replace(/\/+$/,"");
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

  function log(...a){ try{console.log("[MFC]",...a);}catch{} }

  // Load Turnstile only if needed
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

  function pickForm(){
    // Prefer explicit id if present, otherwise button.form, otherwise first form
    const f1 = document.getElementById('accountOpenForm');
    const btn = document.getElementById('submitBtn');
    const f2 = btn && btn.form;
    const f3 = document.querySelector('form');
    return f1 || f2 || f3 || null;
  }

  function setBusy(form, on){
    const buttons = form.querySelectorAll('button, [type="submit"], [type="button"]');
    buttons.forEach(b => { b.disabled = !!on; b.setAttribute('aria-busy', on?'true':'false'); });
  }

  async function postWithFallback(fd){
    const urls = [
      `${BASE}/api/onboarding/account-open`,
      `${BASE}/api/onboarding/submit`
    ];
    const tryPost = async (url) => {
      const res = await fetch(url.replace(/([^:]\/)\/+/g,'$1'), { method: 'POST', body: fd });
      const txt = await res.text();
      let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
      return { res, data };
    };
    const a = await tryPost(urls[0]);
    if (a.res.status !== 404 && a.res.status !== 405) return a;
    return await tryPost(urls[1]);
  }

  function wire(){
    const form = pickForm();
    if (!form || form.dataset.mfcWired === '1') return;
    form.dataset.mfcWired = '1';
    log("account-open wired to", BASE || "(missing API_BASE_URL!)");

    const submitBtn = document.getElementById('submitBtn');

    const MAX = 16 * 1024 * 1024;
    const OK = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
    const invalidFiles = () => {
      const inputs = form.querySelectorAll('input[type="file"]');
      for (const inp of inputs) for (const f of (inp.files || [])) {
        if (!OK.has(f.type) || f.size > MAX) return `${f.name || 'file'} must be PDF/JPG/PNG/WEBP ≤ 16MB`;
      }
      return "";
    };

    const handleSubmit = async (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (!BASE) return alert('Setup issue: API host not set. Please publish scripts/config.js');

      const bad = invalidFiles();
      if (bad) return alert(bad);

      try {
        setBusy(form, true);
        const fd = new FormData(form);

        // Add Turnstile token using both field names (backend accepts either)
        const token = await getToken(form);
        if (token) {
          fd.set('cf_turnstile_response', token);
          fd.set('cf-turnstile-response', token);
        }

        const { res, data } = await postWithFallback(fd);

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `Submit failed (${res.status})`;
          if (res.status === 404) return alert('Submit failed (404). Check API_BASE_URL or redeploy backend.');
          if (res.status === 400 && /captcha/i.test(msg)) return alert('Captcha verification failed. Set TURNSTILE_SECRET on backend.');
          if (res.status === 413) return alert('One or more files exceed 16MB. Reduce size and try again.');
          if (res.status === 415) return alert('Unsupported file type. Use PDF/JPG/PNG/WEBP.');
          return alert(msg);
        }

        alert(`Application received. Reference: ${data?.applicationId || data?.id || 'OK'}`);
        try { form.reset(); } catch {}
      } catch (err) {
        console.error('[MFC] submit error', err);
        alert('Network error submitting form. Check API_BASE_URL in scripts/config.js and try again.');
      } finally {
        setBusy(form, false);
      }
    };

    // 1) Intercept form submits (works for <button type="submit"> and Enter key)
    form.addEventListener('submit', handleSubmit, { capture: true });

    // 2) ALSO catch explicit button clicks if the button is type="button"
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        // Some designs use anchors styled as buttons; prevent stray navigation
        e.preventDefault();
        handleSubmit(e);
      }, { capture: true });
    }
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', wire)
    : wire();
})();
