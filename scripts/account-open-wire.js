// account-open-wire.js (v12) — robust submit with native fallback.
// - Uses the form's action URL (no config.js needed)
// - Only prevents default if we are doing fetch()
// - On any network/JS problem → falls back to native submit
// - Supports Turnstile if present, but doesn't require it

(() => {
  const form = document.getElementById('accountOpenForm');
  if (!form) return;

  const bar = document.getElementById('uploadBar');
  const statusBox = document.getElementById('formStatus');

  // Helper: show status (keeps your visuals)
  function showStatus(msg, ok) {
    if (!statusBox) return;
    statusBox.style.display = 'block';
    statusBox.textContent = msg;
    statusBox.style.borderColor = ok ? 'rgba(60,179,113,.35)' : 'rgba(255,99,71,.35)';
  }

  function setProgress(pct) {
    if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  form.addEventListener('submit', async (e) => {
    // If browser finds invalid fields (e.g., required files), let native validation run.
    if (!form.checkValidity()) return;

    const actionUrl = form.getAttribute('action') || '';
    if (!actionUrl) return; // let native do its thing

    // We attempt AJAX upload to give a nicer UX. If anything looks off, we fall back.
    try {
      e.preventDefault(); // we'll do fetch; if fetch fails we'll call form.submit()
      setProgress(5);
      showStatus('Preparing upload…', true);

      const fd = new FormData(form);

      // Turnstile (optional)
      try {
        const ts = window.turnstile?.getResponse?.();
        if (ts) fd.set('cf_turnstile_response', ts);
      } catch { /* non-fatal */ }

      // Use fetch; show progress via ReadableStream if supported, else coarse steps
      const res = await fetch(actionUrl, {
        method: 'POST',
        body: fd,
        // No need for credentials; CORS handled server-side if used
      });

      setProgress(85);

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) {
        // If server blocks captcha but we want native fallback, uncomment next line:
        // return form.submit();
        showStatus((data && (data.error || data.message)) || text || 'Submit failed', false);
        setProgress(0);
        return;
      }

      setProgress(100);
      const ref = (data && (data.applicationId || data.ref || data.id)) || '';
      showStatus(ref ? `Application received. Reference: ${ref}` : 'Application received.', true);
      alert(ref ? `Application received. Reference: ${ref}` : 'Application received.');
      try { form.reset(); } catch {}
      setTimeout(() => setProgress(0), 800);
    } catch (err) {
      // Any JS/fetch problem → native submit as a safety net
      try { form.submit(); } catch {}
    }
  }, { capture: true }); // capture to run before any old handlers that might call preventDefault
})();
