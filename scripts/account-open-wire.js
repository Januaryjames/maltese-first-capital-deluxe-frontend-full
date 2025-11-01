// /scripts/account-open-wire.js — v3.2 (MFC)
// Safe config + solid submit wiring + legacy/new field support

(() => {
  // ---------- CONFIG (robust) ----------
  const CFG = (window.__MFC_CONFIG || {});
  let API = (typeof CFG.API_BASE_URL === 'function' ? CFG.API_BASE_URL() : CFG.API_BASE_URL) || '';
  API = (API || '').replace(/\/+$/, '');

  // Hard fallback so a missing config never posts to the site origin
  if (!API) {
    API = 'https://maltese-first-capital-deluxe-backend.onrender.com';
    console.warn('[MFC] API_BASE_URL missing; using hard fallback:', API);
  }

  // ---------- HELPERS ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function setStatus(msg, kind = 'error') {
    const box = $('#formStatus');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card';
    box.textContent = msg || '';
  }

  function getTurnstileToken() {
    try {
      return (window.turnstile && window.turnstile.getResponse)
        ? (window.turnstile.getResponse() || '')
        : '';
    } catch { return ''; }
  }

  // ---------- MAIN ----------
  on(document, 'DOMContentLoaded', () => {
    const form      = $('#accountOpenForm');
    const bar       = $('#uploadBar');
    const submitBtn = $('#submitBtn');
    const draftBtn  = $('#saveDraftBtn');

    if (!form) {
      console.warn('[MFC] #accountOpenForm not found');
      return;
    }

    // Ensure no native navigation
    form.setAttribute('action', '');
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');

    // Save draft locally (no files)
    on(draftBtn, 'click', () => {
      try {
        const data = new FormData(form);
        const obj = {};
        for (const [k, v] of data.entries()) {
          if (v instanceof File) continue;
          obj[k] = v;
        }
        localStorage.setItem('mfc_account_open_draft', JSON.stringify(obj));
        alert('Draft saved locally.');
      } catch (e) {
        console.warn('Draft save failed:', e);
      }
    });

    // Submit
    on(form, 'submit', async (e) => {
      e.preventDefault();

      const consent = $('#consentBox');
      if (consent && !consent.checked) {
        setStatus('Please confirm the consent checkbox.', 'error');
        return;
      }

      const fd = new FormData(form);

      // Map visible UX fields → backend canonical (backend also accepts both)
      if (!fd.get('fullName')) {
        const n = fd.get('authorized_person') || fd.get('authorised_person') || '';
        if (n) fd.set('fullName', n);
      }
      if (!fd.get('companyName')) {
        const c = fd.get('company_name') || '';
        if (c) fd.set('companyName', c);
      }

      // Optional Turnstile
      const ts = getTurnstileToken();
      if (ts) fd.set('cf_turnstile_response', ts);

      // UI lock + progress
      submitBtn && (submitBtn.disabled = true);
      setStatus('Submitting…', 'info');
      if (bar) bar.style.width = '35%';

      try {
        // Prefer the alias route (both are mounted)
        const endpoint = API + '/api/onboarding/account-open';

        const res = await fetch(endpoint, {
          method: 'POST',
          body: fd
          // no headers; browser sets multipart boundary
        });

        if (bar) bar.style.width = '70%';

        const raw = await res.text();
        let data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
          setStatus('Could not submit: ' + msg, 'error');
          submitBtn && (submitBtn.disabled = false);
          if (bar) bar.style.width = '0%';
          return;
        }

        if (bar) bar.style.width = '100%';
        const appId = (data && data.applicationId) ? data.applicationId : '';
        setStatus('Application received' + (appId ? ` · Reference: ${appId}` : ''), 'success');

        // Redirect to client login with reference (keeps your current UX)
        const q = appId ? ('?submitted=' + encodeURIComponent(appId)) : '';
        window.location.href = '/client-login.html' + q;
      } catch (err) {
        console.error('[MFC] submit error', err);
        setStatus('Network error submitting. Check API_BASE_URL in scripts/config.js.', 'error');
        submitBtn && (submitBtn.disabled = false);
        if (bar) bar.style.width = '0%';
      }
    });
  });

  // ---------- Console sanity helpers (optional) ----------
  try {
    // Quick dev check: prints the API used
    // (Open DevTools console to read)
    // eslint-disable-next-line no-console
    console.log('[MFC] Account Open API:', API);
  } catch {}
})();
