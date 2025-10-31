// scripts/account-open-wire.js
(() => {
  const CFG = (window.__MF_CONFIG || {});
  const API = (CFG.API_BASE_URL || ""); // same-origin if empty
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

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
      const wid = window.turnstile.render(div, {
        sitekey: SITE_KEY,
        size: 'invisible',
        callback: (t) => res(t)
      });
      try { window.turnstile.execute(wid); } catch { res(""); }
    });
  }

  function attach(){
    // Use the first form on the page (or a more specific selector if you have one)
    const form = document.querySelector('form');
    if (!form) return;

    // Light client guard for uploads (keeps visuals unchanged)
    const MAX = 16 * 1024 * 1024; // 16MB
    const OK = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
    const badFile = () => {
      const inputs = form.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        for (const f of (inp.files || [])) {
          if (!OK.has(f.type) || f.size > MAX) return true;
        }
      }
      return false;
    };

    form.addEventListener('submit', async (e) => {
      try {
        e.preventDefault();
        if (badFile()) {
          alert('One or more files are not allowed. Use PDF/JPG/PNG/WEBP, max 16MB each.');
          return;
        }

        // Build FormData from the existing form as-is
        const fd = new FormData(form);

        // Invisible bot check (server will also verify)
        const token = await getToken(form);
        if (token) {
          fd.append('cf_turnstile_response', token);      // underscore version
          fd.append('cf-turnstile-response', token);      // hyphen version (covers both parsers)
        }

        // POST to backend; same-origin if API == ""
        const url = `${API}/api/onboarding/account-open`.replace(/\/+/g, (m, off) => off === 0 ? m : '/');
        const res = await fetch(url, { method: 'POST', body: fd });
        const text = await res.text();
        let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

        if (!res.ok) {
          throw new Error(data?.error || `Submit failed (${res.status})`);
        }

        // Success UX (no DOM restyle)
        if (data.applicationId || data.id) {
          alert(`Application received. Reference: ${data.applicationId || data.id}`);
        } else {
          alert('Application received.');
        }
        try { form.reset(); } catch {}
      } catch (err) {
        alert(err.message || 'Submit failed');
      }
    }, { capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
