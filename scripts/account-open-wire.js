// scripts/account-open-wire.js  — v3
(() => {
  const cfg = (window.__MFC_CONFIG__ || {});
  const BASE = String(cfg.API_BASE_URL || '').replace(/\/+$/,'');   // harden
  const ENDPOINT = '/api/onboarding/submit';                        // <-- correct path

  const form = document.getElementById('accountOpenForm');
  const bar  = document.getElementById('uploadBar');
  const box  = document.getElementById('formStatus');
  const btn  = document.getElementById('submitBtn');
  const save = document.getElementById('saveDraftBtn');

  if (!form || !btn) return;

  // Helper: status banner
  function showStatus(html, cls='') {
    if (!box) return;
    box.style.display = 'block';
    box.className = 'card ' + cls;
    box.innerHTML = html;
  }

  // Local draft
  if (save) {
    save.addEventListener('click', () => {
      const data = new FormData(form);
      const obj = {};
      for (const [k,v] of data.entries()) if (typeof v === 'string') obj[k] = v;
      localStorage.setItem('mfc_open_draft', JSON.stringify(obj));
      showStatus('<b>Saved locally.</b> You can close and return later.', '');
    });
  }

  // Submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!BASE) { alert('Network error submitting. Check API_BASE_URL in scripts/config.js.'); return; }

    btn.disabled = true; if (save) save.disabled = true;
    showStatus('Submitting… please wait.', '');

    // Build payload
    const fd = new FormData(form);

    // Turnstile (support both field names)
    let ts = '';
    try { ts = window.turnstile?.getResponse?.() || ''; } catch {}
    if (ts) fd.set('cf_turnstile_response', ts);

    // Use XHR so we can show progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + ENDPOINT, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (evt) => {
      if (!bar || !evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      bar.style.width = pct + '%';
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      btn.disabled = false; if (save) save.disabled = false;

      // Reset progress bar after a moment
      setTimeout(() => { if (bar) bar.style.width = '0%'; }, 600);

      // Handle response
      if (xhr.status === 202 || xhr.status === 200 || xhr.status === 201) {
        let data = {};
        try { data = JSON.parse(xhr.responseText || '{}'); } catch {}
        const id = data.applicationId || '(pending id)';
        showStatus(`<b>Submitted.</b> Reference: <code>${id}</code>`, '');
        // redirect to client login with query for UX
        window.location.href = '/client-login.html?submitted=' + encodeURIComponent(id);
        return;
      }

      if (xhr.status === 0) {
        showStatus('Network blocked by browser/Cloudflare. Check domain rules/CORS.', 'error');
        return;
      }

      // 404 → wrong path or proxy. Tell user plainly.
      if (xhr.status === 404) {
        showStatus('Could not submit: HTTP 404. Front-end is not pointing to `/api/onboarding/submit` on the backend.', 'error');
        return;
      }

      // Body message if present
      let msg = '';
      try { msg = (JSON.parse(xhr.responseText||'{}').error) || ''; } catch {}
      showStatus(`Server error${msg ? ': ' + msg : ''}`, 'error');
    };

    xhr.send(fd);
  });

  // Optional health ping to prove wiring
  fetch(BASE + '/api/health').then(r => r.json()).then(h => {
    console.log('MFC backend health:', h);
  }).catch(()=>{});
})();
