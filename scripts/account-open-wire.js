// scripts/account-open-wire.js
(() => {
  const CFG = (window.__MF_CONFIG || {});
  const API = CFG.API_BASE_URL || "";      // same-origin if empty
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY; // public key

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

  async function getToken(formEl){
    if (!SITE_KEY) return "";
    await loadTurnstile();
    return new Promise((res) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
      formEl.appendChild(div);
      const wid = window.turnstile.render(div, { sitekey: SITE_KEY, size: 'invisible', callback: (t) => res(t) });
      try { window.turnstile.execute(wid); } catch { res(""); }
    });
  }

  function attach(){
    const form = document.querySelector('form');
    if (!form) return;

    // Light file guard (no visual change)
    const MAX = 16 * 1024 * 1024; // 16 MB
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
      try {
        if (badFile()) return alert('Use PDF/JPG/PNG/WEBP, max 16MB each.');

        const fd = new FormData(form);
        const token = await getToken(form);
        if (token) {
          fd.append('cf_turnstile_response', token);
          fd.append('cf-turnstile-response', token); // support both spellings server-side
        }

        const url = `${API}/api/onboarding/account-open`.replace(/([^:]\/)\/+/g, '$1');
        const res = await fetch(url, { method: 'POST', body: fd });
        const txt = await res.text();
        let data; try { data = txt ? JSON.parse(txt) : {}; } catch { data = { raw: txt }; }
        if (!res.ok) throw new Error(data?.error || `Submit failed (${res.status})`);

        alert(`Application received. Ref: ${data.applicationId || data.id || 'OK'}`);
        try { form.reset(); } catch {}
      } catch (err) {
        alert(err.message || 'Submit failed');
      }
    }, { capture: true });
  }

  (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', attach) : attach();
})();
