// /scripts/account-open-wire.js — v3.3 stable final
(() => {
  'use strict';

  // ---------- Config ----------
  const CFG = (window.__MFC_CONFIG || {});
  const raw = CFG.API_BASE_URL;
  const base = (typeof raw === 'function' ? raw() : raw) || '';
  const API = base.replace(/\/+$/, '');
  if (!API) console.warn('[MFC] API_BASE_URL missing from scripts/config.js');

  // ---------- Helpers ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const lock = (el, yes) => { if (el) el.disabled = !!yes; };

  function setStatus(msg, kind = 'info') {
    const box = $('#formStatus');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card';
    box.textContent = msg || '';
  }

  function getTurnstileToken() {
    try {
      return (window.turnstile?.getResponse?.() || '');
    } catch {
      return '';
    }
  }

  // ---------- DOM Ready ----------
  on(document, 'DOMContentLoaded', () => {
    const form = $('#accountOpenForm');
    const bar  = $('#uploadBar');
    const submitBtn = $('#submitBtn');
    const draftBtn  = $('#saveDraftBtn');

    if (!form) {
      console.warn('[MFC] #accountOpenForm not found');
      return;
    }

    // Disable browser-native navigation submit
    form.setAttribute('action', '');
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');

    // Save draft locally (no files)
    on(draftBtn, 'click', () => {
      try {
        const data = new FormData(form);
        const obj = {};
        for (const [k, v] of data.entries()) if (!(v instanceof File)) obj[k] = v;
        localStorage.setItem('mfc_account_open_draft', JSON.stringify(obj));
        alert('Draft saved locally.');
      } catch (e) {
        console.warn('Draft save failed:', e);
      }
    });

    // ---------- Submit ----------
    on(form, 'submit', async (e) => {
      e.preventDefault();

      const consent = $('#consentBox');
      if (consent && !consent.checked) {
        setStatus('Please confirm consent checkbox.', 'error');
        return;
      }

      const fd = new FormData(form);

      // Map alt field names → canonical
      if (!fd.get('fullName')) {
        const n = fd.get('authorized_person') || fd.get('authorised_person') || '';
        if (n) fd.set('fullName', n);
      }
      if (!fd.get('companyName')) {
        const c = fd.get('company_name') || '';
        if (c) fd.set('companyName', c);
      }

      // Add Turnstile token if present
      const ts = getTurnstileToken();
      if (ts) fd.set('cf_turnstile_response', ts);

      lock(submitBtn, true);
      setStatus('Submitting…', 'info');
      if (bar) bar.style.width = '40%';

      try {
        const res = await fetch(API + '/api/onboarding/account-open', {
          method: 'POST',
          body: fd
        });

        if (bar) bar.style.width = '70%';
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }

        if (!res.ok) {
          const msg = data.error || data.message || `HTTP ${res.status}`;
          setStatus('Could not submit: ' + msg, 'error');
          lock(submitBtn, false);
          if (bar) bar.style.width = '0%';
          return;
        }

        // Success: backend returns 202 Accepted + applicationId
        if (bar) bar.style.width = '100%';
        const appId = data.applicationId || '';
        setStatus('✅ Application received' + (appId ? ` · Reference: ${appId}` : ''), 'success');

        window.location.href = '/client-login.html?submitted=' + encodeURIComponent(appId);
      } catch (err) {
        console.error('[MFC] submit error:', err);
        setStatus('Network or server error. Check API_BASE_URL and backend health.', 'error');
        lock(submitBtn, false);
        if (bar) bar.style.width = '0%';
      }
    });
  });
})();
