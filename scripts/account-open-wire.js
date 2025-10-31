// scripts/account-open-wire.js
(() => {
  const CFG = (window.__MF_CONFIG || {});
  const BASE = (CFG.API_BASE_URL || "").replace(/\/+$/,""); // no trailing slash
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

  if (!BASE) {
    console.error("[MFC] API_BASE_URL missing in scripts/config.js");
  }

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
      const div = document.createElement('div');
      div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
      (hostEl || document.body).appendChild(div);
      const wid = window.turnstile.render(div, { sitekey: SITE_KEY, size: 'invisible', callback: t => res(t) });
      try { window.turnstile.execute(wid); } catch { res(""); }
    });
  }

  function pickForm(){
    const btn = document.getElementById('submitBtn');
    const f = btn?.closest('form');
    return f || document.querySelector('form');
  }

  async function postWithFallback(fd){
    // Try new alias first, then legacy route if 404/405
    const urls = [
      `${BASE}/api/onboarding/account-open`,
      `${BASE}/api/onboarding/submit`
    ];

    // Helper to POST and parse best-effort JSON
    const tryPost = async (url) => {
      const res = await fetch(url.replace(/([^:]\/)\/+/g,'$1'), { method: 'POST', body: fd });
      let data = null;
      const text = await res.text();
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      return { res, data };
    };

    // 1st attempt
    const first = await tryPost(urls[0]);
    if (first.res.status !== 404 && first.res.status !== 405) return first;

    // Fallback
    const second = await tryPost(urls[1]);
    return second;
  }

  function attach(){
    const form = pickForm();
    if (!form || form.dataset.mfcWired === '1') return;
    form.dataset.mfcWired = '1';

    const MAX = 16 * 1024 * 1024;
    const OK = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
    const badFile = () => {
      const inputs = form.querySelectorAll('input[type="file"]');
      for (const inp of inputs) for (const f of (inp.files || [])) {
        if (!OK.has(f.type) || f.size > MAX) return true;
      }
      return false;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      try {
        if (!BASE) return alert('Setup issue: API host not set. Please publish scripts/config.js');
        if (badFile()) return alert('Use PDF/JPG/PNG/WEBP, max 16MB each.');

        const fd = new FormData(form);

        // Accept both Turnstile names on backend; include both for safety
        const token = await getToken(form);
        if (token) {
          fd.set('cf_turnstile_response', token);
          fd.set('cf-turnstile-response', token);
        }

        const { res, data } = await postWithFallback(fd);

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `Submit failed (${res.status})`;
          // Show clearer hints for common cases
          if (res.status === 404) {
            return alert('Submit failed (404). Check that your backend is deployed and API_BASE_URL points to it.');
          }
          if (res.status === 400 && /captcha/i.test(msg)) {
            return alert('Captcha verification failed. Set TURNSTILE_SECRET on the backend.');
          }
          return alert(msg);
        }

        alert(`Application received. Reference: ${data?.applicationId || data?.id || 'OK'}`);
        try { form.reset(); } catch {}
      } catch (err) {
        console.error('[MFC] submit error', err);
        alert('Network error submitting form. Check API_BASE_URL and try again.');
      }
    }, { capture: true });
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', attach)
    : attach();
})();
