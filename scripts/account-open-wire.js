// account-open-wire.js (v14) — posts to the form's action; maps field/file names to backend.

(() => {
  const form = document.getElementById('accountOpenForm');
  if (!form) return;

  const statusBox = document.getElementById('formStatus');
  const bar = document.getElementById('uploadBar');
  const setProgress = n => { if (bar) bar.style.width = Math.max(0, Math.min(100, n)) + '%'; };
  const show = (msg, ok=true) => {
    if (!statusBox) return;
    statusBox.style.display = 'block';
    statusBox.textContent = msg;
    statusBox.style.borderColor = ok ? 'rgba(60,179,113,.35)' : 'rgba(255,99,71,.35)';
  };

  form.addEventListener('submit', async (ev) => {
    if (!form.checkValidity()) return; // let native validation handle required fields
    const url = form.getAttribute('action');
    if (!url) return;

    try {
      ev.preventDefault();                  // use AJAX; fall back to native on error
      setProgress(5);
      show('Preparing upload…', true);

      const src = new FormData(form);
      const fd  = new FormData();

      // Map your text fields → backend keys
      fd.set('fullName',     src.get('authorized_person') || '');
      fd.set('email',        src.get('email') || '');
      fd.set('phone',        src.get('phone') || '');
      fd.set('companyName',  src.get('company_name') || '');
      fd.set('country',      src.get('country') || '');

      // Map your file inputs → backend keys
      const appendAll = (nameFrom, nameTo) => {
        const files = form.querySelector(`input[name="${nameFrom}"]`)?.files || [];
        for (const f of files) fd.append(nameTo, f, f.name);
      };
      appendAll('docs_corporate', 'companyDocs');   // CR, M&A, Board resolution → companyDocs[]
      appendAll('docs_id',       'passport');       // ID/Passport          → passport[]
      appendAll('docs_poa',      'proofOfAddress'); // Proof of address     → proofOfAddress[]
      appendAll('docs_sof',      'companyDocs');    // Source of funds      → companyDocs[] (extra)
      appendAll('selfie_file',   'selfie');         // Selfie               → selfie[]

      // Turnstile (optional — server can bypass if BYPASS_CAPTCHA=1)
      try {
        const ts = window.turnstile?.getResponse?.();
        if (ts) fd.set('cf_turnstile_response', ts);
      } catch {}

      const res  = await fetch(url, { method: 'POST', body: fd });
      setProgress(85);

      const raw  = await res.text();
      let data; try { data = JSON.parse(raw); } catch { data = { raw }; }

      if (!res.ok) {
        show((data.error || data.message || raw || `HTTP ${res.status}`), false);
        setProgress(0);
        return;
      }

      setProgress(100);
      const ref = data.applicationId || data.ref || data.id || '';
      show(ref ? `Application received. Reference: ${ref}` : 'Application received.', true);
      alert(ref ? `Application received. Reference: ${ref}` : 'Application received.');
      try { form.reset(); } catch {}
      setTimeout(() => setProgress(0), 800);
    } catch {
      try { form.submit(); } catch {}
    }
  }, { capture: true });
})();
