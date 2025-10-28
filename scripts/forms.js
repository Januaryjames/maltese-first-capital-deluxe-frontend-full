// /scripts/forms.js — v31
const API_BASE = 'https://maltese-first-capital-deluxe-backend.onrender.com'; // change if needed

async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.text()) || 'Request failed');
  return res.json().catch(() => ({}));
}

// Contact form
(function attachContact() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('contactStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await postJSON(`${API_BASE}/api/public/contact`, payload);
      status.textContent = 'Thanks — we’ll be in touch within one business day.';
      form.reset();
    } catch (err) {
      status.textContent = 'Sorry — could not send right now.';
      console.error(err);
    }
  });
})();
