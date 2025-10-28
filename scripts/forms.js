<script>
const API_BASE = 'https://maltese-first-capital-deluxe-backend.onrender.com';

/* CONTACT */
async function submitContact(e){
  e.preventDefault();
  const f = e.target;
  const payload = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    phone: f.phone.value.trim(),
    message: f.message.value.trim(),
  };
  const out = f.querySelector('.form-msg');
  out.textContent='Sending...'; out.className='form-msg alert';
  try{
    const r = await fetch(`${API_BASE}/public/contact`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('Network error');
    out.textContent='Thank you. We will reply within one business day.'; out.className='form-msg alert ok';
    f.reset();
  }catch(err){
    out.innerHTML=`Couldn’t reach the server. Email us at <b>hello@maltesefirst.com</b>.`;
    out.className='form-msg alert err';
  }
}

/* ACCOUNT OPEN (KYC/AML) */
async function submitKyc(e){
  e.preventDefault();
  const f = e.target;
  const payload = Object.fromEntries(new FormData(f).entries());
  const out = f.querySelector('.form-msg');
  out.textContent='Submitting...'; out.className='form-msg alert';
  try{
    const r = await fetch(`${API_BASE}/public/account-open`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('Network');
    out.textContent='Application received. Our team will contact you after review.';
    out.className='form-msg alert ok'; f.reset();
  }catch(err){
    out.innerHTML=`Couldn’t submit right now. Please email <b>hello@maltesefirst.com</b> with your details.`;
    out.className='form-msg alert err';
  }
}

/* CLIENT AUTH */
async function clientLogin(e){
  e.preventDefault();
  const f = e.target;
  const payload = { email:f.email.value.trim(), password:f.password.value };
  const out = f.querySelector('.form-msg');
  out.textContent='Signing in...'; out.className='form-msg alert';
  try{
    const r = await fetch(`${API_BASE}/auth/client/login`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    const data = await r.json();
    if(!r.ok) throw new Error(data?.message||'Login failed');
    localStorage.setItem('mfc_token', data.token);
    location.href='/client-dashboard.html';
  }catch(err){
    out.textContent=err.message; out.className='form-msg alert err';
  }
}

/* DASHBOARD DATA */
async function loadClient(){
  const token = localStorage.getItem('mfc_token'); if(!token) return (location.href='/client-login.html');
  const h = {'Authorization':`Bearer ${token}`};
  const me = await fetch(`${API_BASE}/client/me`,{headers:h}).then(r=>r.json()).catch(()=>null);
  if(!me || me.error){localStorage.removeItem('mfc_token'); return location.href='/client-login.html'}
  // hydrate UI
  document.querySelector('[data-client-name]').textContent = me.user?.fullName || me.user?.email;
  const acct = me.account;
  document.querySelector('[data-account-num]').textContent = acct?.number || '—';
  document.querySelector('[data-balance]').textContent = acct ? (acct.balance/100).toFixed(2) : '0.00';

  const tbody = document.querySelector('[data-txs]');
  tbody.innerHTML = (me.transactions||[]).map(tx=>`
    <tr>
      <td>${new Date(tx.createdAt).toLocaleDateString()}</td>
      <td>${tx.type.toUpperCase()}</td>
      <td>${tx.description||''}</td>
      <td>${(tx.amount/100).toFixed(2)}</td>
    </tr>`).join('') || `<tr><td colspan="4">No transactions yet.</td></tr>`;
}

/* ADMIN AUTH (optional basic) */
async function adminLogin(e){
  e.preventDefault();
  const f = e.target;
  const payload = { email:f.email.value.trim(), password:f.password.value };
  const out = f.querySelector('.form-msg');
  out.textContent='Signing in...'; out.className='form-msg alert';
  try{
    const r = await fetch(`${API_BASE}/auth/admin/login`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    const data = await r.json();
    if(!r.ok) throw new Error(data?.message||'Login failed');
    localStorage.setItem('mfc_admin', data.token);
    location.href='/admin-dashboard.html';
  }catch(err){ out.textContent=err.message; out.className='form-msg alert err'; }
}
</script>
