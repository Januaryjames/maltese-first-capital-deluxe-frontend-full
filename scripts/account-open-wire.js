// /scripts/account-open-wire.js — v3.1 (drop-in)
// No visual changes. Robust config + alias endpoint + clear UX.
(() => {
  'use strict';

  // ---- config
  const CFG = (window.__MFC_CONFIG || {});
  // Fallback to same-origin so form still works in staging/local if config.js is missing.
  const API = (CFG.API_BASE_URL || (location.origin || '')).replace(/\/+$/, '');
  if (!CFG.API_BASE_URL) console.warn('[MFC] API_BASE_URL missing from config.js — using same-origin:', API);

  // Server accepts both; prefer the explicit alias you added.
  const ENDPOINT = '/api/onboarding/account-open';

  // ---- helpers
  const $  = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function setStatus(msg, kind = 'info') {
    const box = $('#formStatus');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card';               // keep site style
    box.textContent = msg || '';
  }

  function getTurnstileToken() {
    try {
      return (window.turnstile && window.turnstile.getResponse)
        ? (window.turnstile.getResponse() || '')
        : '';
    } catch { return ''; }
  }

  function lock(btn, yes) { if (btn) btn.disabled = !!yes; }

  // ---- bind
  on(document, 'DOMContentLoaded', () => {
    const form      = $('#accountOpenForm');
    const bar       = $('#uploadBar');
    const submitBtn = $('#submitBtn');
    const draftBtn  = $('#saveDraftBtn');

    if (!form) { console.warn('[MFC] #accountOpenForm not found'); return; }

    // Ensure browser doesn’t try to navigate
    form.setAttribute('action', '');
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');

    // Local draft (no visuals changed)
    on(draftBtn, 'click', () => {
      try {
        const data = new FormData(form);
        const obj = {};
        for (const [k, v] of data.entries()) if (!(v instanceof File)) obj[k] = v;
        localStorage.setItem('mfc_account_open_draft', JSON.stringify(obj));
        alert('Draft saved locally.');
      } catch (e) { console.warn('Draft save failed:', e); }
    });

    // Submit
    on(form, 'submit', async (e) => {
      e.preventDefault();

      // Minimal client check (browser also enforces required fields)
      const consent = $('#consentBox');
      if (consent && !consent.checked) {
        setStatus('Please confirm consent checkbox.', 'error');
        return;
      }

      const fd = new FormData(form);

      // Map alt field names → canonical (backend already supports both; belt & braces)
      if (!fd.get('fullName')) {
        const n = fd.get('authorized_person') || fd.get('authorised_person') || '';
        if (n) fd.set('fullName', n);
      }
      if (!fd.get('companyName')) {
        const c = fd.get('company_name') || '';
        if (c) fd.set('companyName', c);
      }

      // Turnstile token (if widget present)
      const ts = getTurnstileToken();
      if (ts) fd.set('cf_turnstile_response', ts);

      // UI
      lock(submitBtn, true);
      setStatus('Submitting…', 'info');
      if (bar) bar.style.width = '40%';

      try {
        const res = await fetch(API + ENDPOINT, { method: 'POST', body: fd });
        if (bar) bar.style.width = '70%';

        // Try JSON first; fall back to text
        let payload = null, raw = '';
        try { payload = await res.json(); }
        catch { raw = await res.text(); }

        if (!res.ok) {
          const msg = (payload && (payload.error || payload.message)) || raw || `HTTP ${res.status}.`;
          setStatus('Could not submit: ' + msg, 'error');
          lock(submitBtn, false);
          if (bar) bar.style.width = '0%';
          return;
        }

        // Expected: 202 Accepted with applicationId
        const appId = (payload && payload.applicationId) ? payload.applicationId : '';
        if (bar) bar.style.width = '100%';
        setStatus('✅ Application received' + (appId ? ` · Reference: ${appId}` : ''), 'success');

        // Redirect (keeps current visual system)
        window.location.href = '/client-login.html?submitted=' + encodeURIComponent(appId || '');
      } catch (err) {
        console.error('[MFC] submit error:', err);
        setStatus('Network error submitting. Check API_BASE_URL in scripts/config.js.', 'error');
        if (bar) bar.style.width = '0%';
        lock(submitBtn, false);
      }
    });
  });
})();
