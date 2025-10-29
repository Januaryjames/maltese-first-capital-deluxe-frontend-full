<script>
// ============ forms.js (client-side wiring) ============

// Resolve backend URL (uses your saved one; if not set, it warns)
const BACKEND_URL = localStorage.getItem('BACKEND_URL') || '';
function needBackend() {
  if (!BACKEND_URL) {
    alert('Set BACKEND_URL first in the browser console:\nlocalStorage.setItem("BACKEND_URL","https://YOUR-BACKEND.onrender.com")');
    throw new Error('BACKEND_URL missing');
  }
}
function authHeaders() {
  const token = localStorage.getItem('MFC_JWT') || '';
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ---------- KYC: account-open.html ----------
async function handleKycSubmit(e) {
  e.preventDefault();
  try {
    needBackend();
    const form = e.currentTarget;
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const data = new FormData(form);

    btn.disabled = true; btn.textContent = 'Submitting…';
    status.textContent = 'Uploading documents…';

    const res = await fetch(`${BACKEND_URL}/api/kyc/submit`, {
      method: 'POST',
      body: data
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json?.message || 'KYC submit failed');

    status.textContent = 'Submitted. Our team will review shortly.';
    btn.textContent = 'Submitted';
    form.reset();
  } catch (err) {
    alert(err.message || 'Error submitting KYC');
  } finally {
    const btn = e.currentTarget.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false, btn.textContent = 'Continue';
  }
}

// ---------- Client Login (email + password triggers OTP) ----------
async function handleClientLogin(e) {
  e.preventDefault();
  try {
    needBackend();
    const form = e.currentTarget;
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');

    const payload = Object.fromEntries(new FormData(form).entries());

    btn.disabled = true; btn.textContent = 'Sending OTP…';
    status.textContent = 'Requesting OTP…';

    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Login failed');

    // server should return a short-lived temp token or nonce for OTP verification
    sessionStorage.setItem('MFC_LOGIN_NONCE', json?.nonce || '');
    sessionStorage.setItem('MFC_LOGIN_EMAIL', payload.email);
    window.location.href = '/verify-otp.html';
  } catch (err) {
    alert(err.message || 'Login error');
  } finally {
    const btn = e.currentTarget.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false, btn.textContent = 'Sign in';
  }
}

// ---------- Verify OTP ----------
async function handleVerifyOtp(e) {
  e.preventDefault();
  try {
    needBackend();
    const form = e.currentTarget;
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');

    const email = sessionStorage.getItem('MFC_LOGIN_EMAIL') || '';
    const nonce = sessionStorage.getItem('MFC_LOGIN_NONCE') || '';
    const otp = (new FormData(form)).get('otp');

    if (!email || !nonce) throw new Error('Session expired. Please login again.');

    btn.disabled = true; btn.textContent = 'Verifying…';
    status.textContent = 'Checking code…';

    const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nonce, otp })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Invalid OTP');

    // store JWT, proceed
    localStorage.setItem('MFC_JWT', json.token);
    sessionStorage.removeItem('MFC_LOGIN_EMAIL');
    sessionStorage.removeItem('MFC_LOGIN_NONCE');
    window.location.href = '/client-dashboard.html';
  } catch (err) {
    alert(err.message || 'OTP error');
  } finally {
    const btn = e.currentTarget.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false, btn.textContent = 'Verify';
  }
}

// ---------- Client Dashboard boot ----------
async function loadClientOverview() {
  try {
    needBackend();
    const res = await fetch(`${BACKEND_URL}/api/client/overview`, {
      headers: { ...authHeaders() }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to fetch overview');

    // Expected shape:
    // {
    //   client: { name, email },
    //   accounts: [{ accountNumber8, balance, currency }],
    //   statements: [{ id, month, url }],
    //   transactions: [{ id, date, amount, type, description }]
    // }

    // Header name
    const nameEl = document.querySelector('[data-client-name]');
    if (nameEl && json?.client?.name) nameEl.textContent = json.client.name;

    // Accounts
    const accWrap = document.querySelector('[data-accounts]');
    if (accWrap) {
      accWrap.innerHTML = (json.accounts || []).map(a => `
        <div class="panel">
          <div><strong>Account:</strong> ${a.accountNumber8}</div>
          <div><strong>Balance:</strong> ${Number(a.balance).toLocaleString()} ${a.currency || 'USD'}</div>
        </div>
      `).join('') || '<div class="panel">No accounts yet.</div>';
    }

    // Transactions
    const txWrap = document.querySelector('[data-transactions]');
    if (txWrap) {
      txWrap.innerHTML = (json.transactions || []).slice(0, 20).map(t => `
        <div class="panel">
          <div><strong>${t.date?.slice(0,10) || ''}</strong> — ${t.description || ''}</div>
          <div>${t.type || ''} · ${Number(t.amount).toLocaleString()} ${t.currency || 'USD'}</div>
        </div>
      `).join('') || '<div class="panel">No transactions yet.</div>';
    }

    // Statements
    const stWrap = document.querySelector('[data-statements]');
    if (stWrap) {
      stWrap.innerHTML = (json.statements || []).map(s => `
        <div class="panel">
          <div><strong>${s.month}</strong></div>
          ${s.url ? `<a class="btn outline" href="${s.url}" target="_blank" rel="noopener">View PDF</a>` : '<em>Not available</em>'}
        </div>
      `).join('') || '<div class="panel">No statements published.</div>';
    }

  } catch (err) {
    console.error(err);
    alert(err.message || 'Could not load dashboard');
    // optional: redirect to login if unauthorized
    // window.location.href = '/client-login.html';
  }
}

// ---------- Hook forms by page ----------
document.addEventListener('DOMContentLoaded', () => {
  // KYC form
  const kycForm = document.querySelector('#kycForm');
  if (kycForm) kycForm.addEventListener('submit', handleKycSubmit);

  // login
  const loginForm = document.querySelector('#loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleClientLogin);

  // verify otp
  const otpForm = document.querySelector('#otpForm');
  if (otpForm) otpForm.addEventListener('submit', handleVerifyOtp);

  // dashboard
  if (document.body.dataset.page === 'client-dashboard') {
    loadClientOverview();
  }
});
</script>
