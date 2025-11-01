// /scripts/account-open-wire.js — v3.2 (drop-in, no visual changes)
(() => {
  'use strict';

  // ---------- Config ----------
  const CFG = (window.__MFC_CONFIG || {});
  // Fallback to same-origin if config.js is missing (useful for staging/local).
  const API_BASE = (CFG.API_BASE_URL || (location.origin || '')).replace(/\/+$/, '');
  if (!CFG.API_BASE_URL) console.warn('[MFC] API_BASE_URL missing from config.js — using same-origin:', API_BASE);

  // Use the explicit alias your backend exposes
  const ENDPOINT = '/api/onboarding/account-open';

  // ---------- Utils ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const lock = (el, yes) => { if (el) el.disabled = !!yes; };

  function setStatus(msg, kind = 'info') {
    const box = $('#formStatus');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card';      // keep site styling
    box.textContent = msg || '';
  }

  function getTurnstileToken() {
    try {
      return (window.turnstile && window.turnstile.getResponse)
        ? (window.turnstile.getResponse() || '')
        : '';
    } catch { return ''; }
  }

  // ---------- Main ----------
  on(document, 'DOMContentLoaded', () => {
    const form      = $('#accountOpenForm');
    const bar       = $('#uploadBar');
    const submitBtn = $('#submitBtn');
    const draftBtn  = $('#saveDraftBtn');

    if (!form) { console.warn('[MFC] #accountOpenForm not found'); return; }

    // Ensure browser doesn't navigate away
    form.setAttribute('action', '');
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');

    // Save draft locally (no files, no visuals changed)
    on(draftBtn, 'click', () => {
      try {
        const data = new FormData(form);
        const obj = {};
        for (const [k, v] of data.entries()) if (!(v instanceof File)) obj[k] = v;
        localStorage.setItem('mfc_account_open_draft', JSON.stringify(obj));
        alert('Draft saved locally.');
      } catch (e) {
        console.warn('[MFC] Draft save failed:', e);
      }
    });

    // Submit handler
    on(form, 'submit', async (e) => {
      e.preventDefault();

      // Minimal client-side check (browser will enforce required too)
      const consent = $('#consentBox');
      if (consent && !consent.checked) {
        setStatus('Please confirm consent checkbox.', 'error');
        return;
      }

      const fd = new FormData(form);

      // Map alternate names → canonical (backend also handles both; this is extra-safe)
      if (!fd.get('fullName')) {
        const n = fd.get('authorized_person') || fd.get('authorised_person') || '';
        if (n) fd.set('fullName', n);
      }
      if (!fd.get('companyName')) {
        const c = fd.get('company_name') || '';
        if (c) fd.set('companyName', c);
      }

      // Turnstile token if widget present
      const ts = getTurnstileToken();
      if (ts) fd.set('cf_turnstile_response', ts);

      // UI feedback
      lock(submitBtn, true);
      setStatus('Submitting…', 'info');
      if (bar) bar.style.width = '40%';

      try {
        const res = await fetch(API_BASE + ENDPOINT, { method: 'POST', body: fd });
        if (bar) bar.style.width = '70%';

        // Prefer JSON; fall back to text
        let data = null, raw = '';
        try { data = await res.json(); }
        catch { raw = await res.text(); }

        if (!res.ok) {
          const msg = (data && (data.error || data.message)) || raw || `HTTP ${res.status}.`;
          setStatus('Could not submit: ' + msg, 'error');
          if (bar) bar.style.width = '0%';
          lock(submitBtn, false);
          return;
        }

        // Expected: 202 Accepted with applicationId
        const appId = (data && data.applicationId) ? data.applicationId : '';
        if (bar) bar.style.width = '100%';
        setStatus('✅ Application received' + (appId ? ` · Reference: ${appId}` : ''), 'success');

        // Redirect (keeps your current visuals/flow)
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
