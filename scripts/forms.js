/* ========== forms.js v42 ========== */
const BACKEND_BASE =
  document.querySelector('meta[name="backend-base"]')?.content?.trim() ||
  'https://maltese-first-capital-deluxe-backend.onrender.com';

const Routes = {
  contact: [`${BACKEND_BASE}/api/public/contact`, `${BACKEND_BASE}/api/public/enquiry`],
  kyc:     [`${BACKEND_BASE}/api/public/kyc`,     `${BACKEND_BASE}/api/public/account-open`],
  login:   `${BACKEND_BASE}/api/auth/login`,
  me:      `${BACKEND_BASE}/api/client/me`,
  accounts:`${BACKEND_BASE}/api/client/accounts`,
  tx:      (accountId) => `${BACKEND_BASE}/api/client/transactions?accountId=${encodeURIComponent(accountId)}`
};

async function postWithFallback(urls, body, isForm=false) {
  const list = Array.isArray(urls) ? urls : [urls];
  let lastErr;
  for (const u of list) {
    try {
      const res = await fetch(u, {
        method: 'POST',
        body: isForm ? body : JSON.stringify(body),
        headers: isForm ? {} : {'Content-Type':'application/json'}
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json().catch(()=>({ok:true}));
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Network error');
}

/* Contact */
export async function initContactForm(){
  const f = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    status.textContent = 'Sending...';
    const data = Object.fromEntries(new FormData(f).entries());
    try{
      await postWithFallback(Routes.contact, data);
      status.textContent = 'Thanks — we will get back to you shortly.';
      f.reset();
    }catch(err){
      status.textContent = 'Could not send. Please try again in a moment.';
      console.error(err);
    }
  });
}

/* Account Open (KYC) */
export async function initAccountOpenForm(){
  const f = document.getElementById('kyc-form');
  const status = document.getElementById('kyc-status');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    status.textContent = 'Submitting...';
    const fd = new FormData(f);
    try{
      await postWithFallback(Routes.kyc, fd, true);
      status.textContent = 'Application received. Our team will contact you.';
      f.reset();
    }catch(err){
      status.textContent = 'Submission failed. Please check fields and try again.';
      console.error(err);
    }
  });
}

/* Client Login */
export async function initClientLogin(){
  const f = document.getElementById('login-form');
  const status = document.getElementById('login-status');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    status.textContent = 'Signing in...';
    const { email, password } = Object.fromEntries(new FormData(f).entries());
    try{
      const res = await postWithFallback(Routes.login, { email, password });
      if(!res?.token) throw new Error('No token returned');
      localStorage.setItem('mfc_token', res.token);
      window.location.href = '/client-dashboard.html';
    }catch(err){
      status.textContent = 'Login failed. Check details.';
      console.error(err);
    }
  });
}

/* Client Dashboard — only run on dashboard page */
export async function initClientDashboard(){
  // Guard: only initialize if dashboard elements exist
  const onDash = document.getElementById('accounts-list') || document.getElementById('client-name') || document.getElementById('tx-wrap');
  if(!onDash) return;

  const token = localStorage.getItem('mfc_token');
  if(!token){ window.location.replace('/client-login.html'); return; }

  const meEl = document.getElementById('client-name');
  const acctList = document.getElementById('accounts-list');
  const txWrap = document.getElementById('tx-wrap');

  async function authedGet(url){
    const r = await fetch(url, { headers:{ Authorization:`Bearer ${token}` }});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  }

  try{
    const me = await authedGet(Routes.me);
    if(meEl) meEl.textContent = me?.name || me?.fullName || me?.email || 'Client';

    const accounts = await authedGet(Routes.accounts);
    if(Array.isArray(accounts) && accounts.length){
      acctList.innerHTML = accounts.map((a,i)=>`
        <div class="form-card" data-id="${a._id || a.id}">
          <p class="eyebrow">Account ${i+1}</p>
          <h3 style="margin:.25rem 0 .35rem;">${a.currency || 'USD'} • ${String(a.accountNumber || '').padStart(8,'0')}</h3>
          <p>Balance: <strong>${Number(a.balance ?? 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></p>
          <button class="btn outline view-tx" data-ac="${a._id || a.id}">View transactions</button>
        </div>
      `).join('');
    } else {
      acctList.innerHTML = `<div class="form-card"><p>No accounts yet.</p></div>`;
    }

    acctList.addEventListener('click', async (e)=>{
      const btn = e.target.closest('.view-tx');
      if(!btn) return;
      txWrap.innerHTML = '<p class="form-status">Loading transactions…</p>';
      try{
        const tx = await authedGet(Routes.tx(btn.dataset.ac));
        const rows = (tx || []).map(t=>`
          <tr>
            <td>${new Date(t.createdAt || t.date || Date.now()).toLocaleString()}</td>
            <td>${t.type || t.side || '-'}</td>
            <td>${t.description || '-'}</td>
            <td>${(t.currency || 'USD')}</td>
            <td>${Number(t.amount ?? 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          </tr>
        `).join('');
        txWrap.innerHTML = `
          <table class="table">
            <thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Cur</th><th>Amount</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">No transactions.</td></tr>'}</tbody>
          </table>`;
      }catch(err){
        txWrap.innerHTML = '<p class="form-status">Could not load transactions.</p>';
        console.error(err);
      }
    });

  }catch(err){
    console.error(err);
    localStorage.removeItem('mfc_token');
    window.location.replace('/client-login.html');
  }
}

/* Auto-init by page */
document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initAccountOpenForm();
  initClientLogin();
  initClientDashboard(); // now safely guarded
});
