/* /scripts/account-open-wire.js — v4 (404-proof, no visual changes) */
(() => {
  const CFG = window.__MFC_CONFIG || {};
  const API = (CFG.API_BASE_URL || '').replace(/\/+$/, '');
  const $ = (s, r = document) => r.querySelector(s);

  function setStatus(msg) {
    const box = $('#formStatus');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card';
    box.textContent = msg || '';
  }

  function getTS() {
    try { return (window.turnstile && window.turnstile.getResponse) ? (window.turnstile.getResponse() || '') : ''; }
    catch { return ''; }
  }

  async function postFD(url, fd) {
    const r = await fetch(url, { method: 'POST', body: fd });
    const t = await r.text();
    let j = {};
    try { j = t ? JSON.parse(t) : {}; } catch {}
    return { ok: r.ok, status: r.status, data: j, raw: t };
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = $('#accountOpenForm');
    const bar  = $('#uploadBar');
    const btn  = $('#submitBtn');
    if (!form) return;

    // Don’t navigate away
    form.setAttribute('action', '');
    form.setAttribute('method', 'post');
    form.setAttribute('enctype', 'multipart/form-data');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!API) { setStatus('Could not submit: API base missing'); return; }

      // Build FormData as-is from your fields (keeps visuals, names intact)
      const fd = new FormData(form);

      // Soft mapping to canonical backend names (belt & braces)
      if (!fd.get('fullName')) {
        const n = fd.get('authorized_person') || fd.get('authorised_person') || '';
        if (n) fd.set('fullName', n);
      }
      if (!fd.get('companyName')) {
        const c = fd.get('company_name') || '';
        if (c) fd.set('companyName', c);
      }

      // Optional Turnstile field (ignored if not present)
      const ts = getTS();
      if (ts) fd.set('cf_turnstile_response', ts);

      // Lock UI
      if (btn) btn.disabled = true;
      if (bar) bar.style.width = '30%';
      setStatus('Submitting…');

      // Try email-only route first
      const primaryURL = API + '/api/email/account-open';
      const r1 = await postFD(primaryURL, fd);

      // If 404, auto-fallback to legacy KYC aliases
      let final = r1;
      if (r1.status === 404) {
        const r2 = await postFD(API + '/api/onboarding/account-open', fd);
        final = r2;
        if (!r2.ok && r2.status === 404) {
          const r3 = await postFD(API + '/api/onboarding/submit', fd);
          final = r3;
        }
      }

      if (bar) bar.style.width = final.ok ? '100%' : '0%';

      if (!final.ok) {
        const msg = final.data?.error || `HTTP ${final.status}`;
        setStatus('Could not submit: ' + msg);
        if (btn) btn.disabled = false;
        return;
      }

      // Success UX (no visual change to layout)
      const appId = final.data?.applicationId || '';
      setStatus('Application received' + (appId ? ` · Reference: ${appId}` : ''));
      // Optional redirect (you already had this)
      window.location.href = '/client-login.html?submitted=' + encodeURIComponent(appId || '');
    });
  });
})();
