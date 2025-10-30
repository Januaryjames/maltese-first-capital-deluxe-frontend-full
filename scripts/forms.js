/* Maltese First Capital — Account Open form logic
   Handles validation, selfie capture, multi-file upload with progress,
   and POSTs to backend API. Page-scoped; safe to load site-wide.
*/

(() => {
  // ====== CONFIG ======
  // Change BASE only if your Render URL differs:
  const API_BASE = window.MFC_API_BASE || 'https://maltese-first-capital-deluxe-backend.onrender.com';
  // Final endpoint (ensure this exists in your backend public routes):
  const ENDPOINT = `${API_BASE}/api/public/account-open`;

  // ====== DOM ======
  const form = document.getElementById('accountOpenForm');
  const statusBox = document.getElementById('formStatus');
  const uploadBar = document.getElementById('uploadBar');
  const submitBtn = document.getElementById('submitBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');

  // Camera elements
  const startCamBtn = document.getElementById('startCamBtn');
  const captureBtn = document.getElementById('captureBtn');
  const resetCamBtn = document.getElementById('resetCamBtn');
  const video = document.getElementById('selfieVideo');
  const selfiePreview = document.getElementById('selfiePreview');

  let mediaStream = null;
  let selfieBlob = null; // captured selfie

  // ====== helpers ======
  const showStatus = (html, kind = 'info') => {
    statusBox.style.display = 'block';
    statusBox.style.borderColor = (kind === 'error') ? 'rgba(255,99,99,.45)' :
                                  (kind === 'success') ? 'rgba(126,217,87,.45)' :
                                  'rgba(212,175,55,.35)';
    statusBox.innerHTML = html;
  };

  const clearStatus = () => {
    statusBox.style.display = 'none';
    statusBox.innerHTML = '';
  };

  const lock = () => { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; };
  const unlock = () => { submitBtn.disabled = false; submitBtn.textContent = 'Submit Application'; };

  const setProgress = (pct) => {
    uploadBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  };

  const dataURLtoBlob = (dataUrl) => {
    const [meta, content] = dataUrl.split(',');
    const mime = meta.match(/data:(.*?);/)[1] || 'image/jpeg';
    const binStr = atob(content);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i=0;i<len;i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  // ====== Camera / Selfie ======
  async function startCamera() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio:false });
      video.srcObject = mediaStream;
      video.style.display = 'block';
      selfiePreview.style.display = 'none';
      await video.play();
      captureBtn.disabled = false;
      resetCamBtn.disabled = false;
      startCamBtn.disabled = true;
      clearStatus();
    } catch (err) {
      showStatus(`<strong>Camera error:</strong> ${err.message}. You can upload a selfie instead.`, 'error');
    }
  }

  function captureSelfie() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      selfieBlob = dataURLtoBlob(dataUrl);

      // Show preview
      selfiePreview.src = dataUrl;
      selfiePreview.style.display = 'block';
      video.style.display = 'none';

      showStatus('Selfie captured. You can submit now.', 'info');
    } catch (e) {
      showStatus(`Could not capture selfie: ${e.message}`, 'error');
    }
  }

  function resetCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
    selfieBlob = null;
    video.style.display = 'none';
    selfiePreview.style.display = 'none';
    startCamBtn.disabled = false;
    captureBtn.disabled = true;
    resetCamBtn.disabled = true;
  }

  // ====== Draft (localStorage) ======
  function saveDraft() {
    const fd = new FormData(form);
    const obj = {};
    fd.forEach((v,k) => { if (!(v instanceof File)) obj[k] = v; });
    localStorage.setItem('mfc_account_open_draft', JSON.stringify(obj));
    showStatus('Draft saved locally on this device.', 'info');
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem('mfc_account_open_draft');
      if (!raw) return;
      const obj = JSON.parse(raw);
      Object.keys(obj).forEach(k => {
        const el = form.elements[k];
        if (!el) return;
        if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          el.value = obj[k];
        }
      });
    } catch {}
  }

  // ====== Submit ======
  function buildFormData() {
    const fd = new FormData(form);

    // If user captured selfie via camera, prefer that
    if (selfieBlob) {
      fd.append('selfie', selfieBlob, 'selfie.jpg');
    } else {
      // else if they uploaded a selfie file via input[name=selfie_file], backend can accept it too
      const up = form.elements['selfie_file'];
      if (up && up.files && up.files.length) {
        fd.append('selfie', up.files[0], up.files[0].name);
      }
    }

    // Client hints
    fd.append('client_tz', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    fd.append('client_ua', navigator.userAgent || '');

    return fd;
  }

  function postWithProgress(url, formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = (evt.loaded / evt.total) * 100;
          setProgress(pct);
        }
      };

      xhr.onload = () => {
        try {
          const body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(body);
          } else {
            reject(new Error(body?.error || `HTTP ${xhr.status}`));
          }
        } catch (e) {
          if (xhr.status >= 200 && xhr.status < 300) resolve({ ok:true });
          else reject(new Error(`HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    clearStatus();

    if (!form.reportValidity()) {
      showStatus('Please complete the required fields.', 'error');
      return;
    }

    // size guard: 25 MB total (adjust if needed)
    const totalBytes = [...form.querySelectorAll('input[type="file"]')]
      .flatMap(i => Array.from(i.files || []))
      .reduce((sum,f) => sum + (f?.size || 0), selfieBlob ? selfieBlob.size : 0);

    if (totalBytes > 25 * 1024 * 1024) {
      showStatus('Total file size exceeds 25 MB. Please upload smaller files.', 'error');
      return;
    }

    lock(); setProgress(2);

    try {
      const fd = buildFormData();
      const res = await postWithProgress(ENDPOINT, fd);

      setProgress(100);
      showStatus(
        `<strong>Application submitted.</strong><br>
         Reference: <code>${res?.reference || '—'}</code><br>
         We’ll email confirmation once Compliance checks are complete.`,
        'success'
      );

      // Clear draft on success
      localStorage.removeItem('mfc_account_open_draft');
      form.reset();
      resetCamera();
    } catch (err) {
      showStatus(`Could not submit: ${err.message}.`, 'error');
    } finally {
      unlock();
      setProgress(0);
    }
  }

  // ====== Events ======
  if (form) form.addEventListener('submit', onSubmit);
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);
  if (startCamBtn) startCamBtn.addEventListener('click', startCamera);
  if (captureBtn) captureBtn.addEventListener('click', captureSelfie);
  if (resetCamBtn) resetCamBtn.addEventListener('click', resetCamera);

  // Pre-load draft if available
  loadDraft();
})();
