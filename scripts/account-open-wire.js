// account-open-wire.js (v13)
// Binds submit correctly, posts to the form's action URL,
// adds Turnstile token if present, and falls back to native submit on any error.

(() => {
  const form = document.getElementById('accountOpenForm');
  if (!form) return;

  const bar = document.getElementById('uploadBar');
  const statusBox = document.getElementById('formStatus');

  const setProgress = (n) => { if (bar) bar.style.width = Math.max(0, Math.min(100, n)) + '%'; };
  const show = (msg, ok=true) => {
    if (!statusBox) return;
    statusBox.style.display = 'block';
    statusBox.textContent = msg;
    statusBox.style.borderColor = ok ? 'rgba(60,179,113,.35)' : 'rgba(255,99,71,.35)';
  };

  form.addEventListener('submit', async (ev) => {
    // Let native HTML5 validation run if something is missing.
    if (!form.checkValidity()) return;

    const actionUrl = form.getAttribute('action');
    if (!actionUrl) return; // nothing to do; native submit will proceed

    try {
      // We do AJAX for nicer UX. If anything fails, we fall back to native submit.
      ev.preventDefault();
      setProgress(5);
      show('Preparing upload…', true);

      const fd = new FormData(form);

      // Optional: Turnstile token, if the widget is on the page
      try {
        const ts = window.turnstile?.getResponse?.();
        if (ts) fd.set('cf_turnstile_response', ts);
      } catch { /* non-fatal */ }

      const res = await fetch(actionUrl, { method: 'POST', body: fd });
      setProgress(85);

      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) {
        show((data && (data.error || data.message)) || text || 'Submit failed', false);
        setProgress(0);
        return;
      }

      setProgress(100);
      const ref = data?.applicationId || data?.ref || data?.id || '';
      show(ref ? `Application received. Reference: ${ref}` : 'Application received.', true);
      alert(ref ? `Application received. Reference: ${ref}` : 'Application received.');
      try { form.reset(); } catch {}
      setTimeout(() => setProgress(0), 800);
    } catch {
      // Hard fallback → native multipart POST
      try { form.submit(); } catch {}
    }
  }, { capture: true }); // capture so old handlers can't swallow the submit
})();
