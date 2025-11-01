// /scripts/account-open-wire.js  — v3
(() => {
  // ---- config
  const CFG = (window.__MFC_CONFIG || {});
  const API  = (CFG.API_BASE_URL || '').replace(/\/+$/,'');   // no trailing slash
  if (!API) console.warn('[MFC] API_BASE_URL missing from config.js');

  // ---- helpers
  const $ = (sel, root=document) => root.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function setStatus(msg, kind='error') {
    const box = $('#formStatus');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card';           // keep your visual style
    box.textContent = msg || '';
  }

  function getTurnstileToken() {
    try {
      // Works if you included Turnstile; otherwise returns ""
      return (window.turnstile && window.turnstile.getResponse)
        ? window.turnstile.getResponse() || ''
        : '';
    } catch { return ''; }
  }

  // ---- bind once DOM is ready
  on(document, 'DOMContentLoaded', () => {
    const form = $('#accountOpenForm');
    const bar  = $('#uploadBar');
    const submitBtn = $('#submitBtn');
    const draftBtn  = $('#saveDraftBtn');

    if (!form) {
      console.warn('[MFC] accountOpenForm not found');
      return;
    }

    // Safety: kill native nav submit
    form.setAttribute('action', ''); // ensure no server nav
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');

    // Save Draft (local only, no visuals changed)
    on(draftBtn, 'click', () => {
      try {
        const data = new FormData(form);
        const obj = {};
        for (const [k,v] of data.entries()) {
          if (v instanceof File) continue; // do not persist files
          obj[k] = v;
        }
        localStorage.setItem('mfc_account_open_draft', JSON.stringify(obj));
        alert('Draft saved locally.');
      } catch (e) {
        console.warn('Draft save failed:', e);
      }
    });

    // Submit handler
    on(form, 'submit', async (e) => {
      e.preventDefault();

      // basic required checks (browser will also enforce)
      const consent = $('#consentBox');
      if (consent && !consent.checked) {
        setStatus('Please confirm consent checkbox.', 'error');
        return;
      }

      // Build payload
      const fd = new FormData(form);

      // Field mapping to backend canonical names (keeps UX untouched)
      // (Backend also accepts both names, this is just belt & braces.)
      if (!fd.get('fullName')) {
        const n = fd.get('authorized_person') || fd.get('authorised_person') || '';
        if (n) fd.set('fullName', n);
      }
      if (!fd.get('companyName')) {
        const c = fd.get('company_name') || '';
        if (c) fd.set('companyName', c);
      }

      // Turnstile token if present
      const ts = getTurnstileToken();
      if (ts) fd.set('cf_turnstile_response', ts);

      // UI: lock
      submitBtn && (submitBtn.disabled = true);
      setStatus('Submitting…', 'info');

      // Progress (fires for fetch body read; not perfect but gives motion)
      if (bar) bar.style.width = '40%';

      try {
        const res = await fetch(API + '/api/onboarding/submit', {
          method: 'POST',
          body: fd,
          // No custom headers, browser sets multipart boundary
          // credentials not required for this route
        });

        if (bar) bar.style.width = '70%';

        let text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { /* plain text */ }

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || (`HTTP ${res.status}.`);
          setStatus('Could not submit: ' + msg, 'error');
          submitBtn && (submitBtn.disabled = false);
          if (bar) bar.style.width = '0%';
          return;
        }

        // Success (backend returns 202 + applicationId)
        if (bar) bar.style.width = '100%';
        const appId = (data && data.applicationId) ? data.applicationId : '';
        setStatus('Application received' + (appId ? ` · Reference: ${appId}` : ''), 'success');

        // optional redirect (keeps your visuals)
        window.location.href = '/client-login.html?submitted=' + encodeURIComponent(appId || '');
      } catch (err) {
        console.error(err);
        setStatus('Network error submitting. Check API_BASE_URL in scripts/config.js.', 'error');
        submitBtn && (submitBtn.disabled = false);
        if (bar) bar.style.width = '0%';
      }
    });
  });
})();
