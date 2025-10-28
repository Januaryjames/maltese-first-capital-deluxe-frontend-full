/* ========== admin.js v41 ========== */
const BACKEND =
  document.querySelector('meta[name="backend-base"]')?.content?.trim() ||
  'https://maltese-first-capital-deluxe-backend.onrender.com';

const AdminRoutes = {
  login:    `${BACKEND}/api/admin/login`,
  users:    `${BACKEND}/api/admin/users`,
  accounts: `${BACKEND}/api/admin/accounts`,
  kyc:      `${BACKEND}/api/admin/kyc-submissions`
};

function token(){ return localStorage.getItem('mfc_admin_token'); }
function setToken(t){ localStorage.setItem('mfc_admin_token', t); }
export function adminLogout(){ localStorage.removeItem('mfc_admin_token'); location.href='/admin-login.html'; }

async function aget(url){
  const r = await fetch(url, { headers:{ Authorization:`Bearer ${token()}` }});
  if(!r.ok) throw new Error(await r.text()); return r.json();
}
async function apost(url, body){
  const r = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token()}` }, body: JSON.stringify(body) });
  if(!r.ok) throw new Error(await r.text()); return r.json().catch(()=>({ok:true}));
}

/* Admin login */
export function initAdminLogin(){
  const f = document.getElementById('admin-login-form');
  const status = document.getElementById('admin-login-status');
  if(!f) return;
  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    status.textContent = 'Signing in...';
    const { email, password } = Object.fromEntries(new FormData(f).entries());
    try{
      const res = await fetch(AdminRoutes.login,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password})});
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if(!data?.token) throw new Error('No token');
      setToken(data.token);
      location.href = '/admin-dashboard.html';
    }catch(err){ status.textContent = 'Login failed.'; console.error(err); }
  });
}

/* Admin dashboard */
export function initAdminDashboard(){
  if(!token()){ location.replace('/admin-login.html'); return; }
  const createForm = document.getElementById('create-account-form');
  const createStatus = document.getElementById('create-status');
  const usersWrap = document.getElementById('users-wrap');
  const kycWrap = document.getElementById('kyc-wrap');

  function gen8(){ return String(Math.floor(10_000_000 + Math.random()*89_999_999)); }

  if(createForm){
    createForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      createStatus.textContent = 'Creating...';
      const d = Object.fromEntries(new FormData(createForm).entries());
      const body = {
        email: d.email,
        currency: d.currency || 'USD',
        openingBalance: Number(d.openingBalance || 0),
        accountNumber: d.accountNumber?.trim() || gen8()
      };
      try{
        await apost(AdminRoutes.accounts, body);
        createStatus.textContent = 'Account created.';
        createForm.reset();
      }catch(err){
        createStatus.textContent = 'Failed to create.';
        console.error(err);
      }
    });
  }

  (async ()=>{
    try{
      const users = await aget(AdminRoutes.users).catch(()=>[]);
      usersWrap.innerHTML = Array.isArray(users) && users.length ? `
        <table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
          <tbody>${users.map(u=>`
            <tr><td>${u.name || u.fullName || '-'}</td><td>${u.email || '-'}</td><td><span class="badge">${u.status || 'active'}</span></td></tr>
          `).join('')}</tbody>
        </table>` : '<p class="form-status">No users.</p>';

      const kyc = await aget(AdminRoutes.kyc).catch(()=>[]);
      kycWrap.innerHTML = Array.isArray(kyc) && kyc.length ? `
        <table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Submitted</th><th>Status</th></tr></thead>
          <tbody>${kyc.map(k=>`
            <tr><td>${k.fullName||'-'}</td><td>${k.email||'-'}</td><td>${k.country||'-'}</td>
            <td>${new Date(k.createdAt||Date.now()).toLocaleString()}</td>
            <td><span class="badge gold">${k.status||'pending'}</span></td></tr>`).join('')}
          </tbody>
        </table>` : '<p class="form-status">No KYC submissions.</p>';
    }catch(e){ console.error(e); }
  })();
}

/* Auto-init */
document.addEventListener('DOMContentLoaded', ()=>{
  initAdminLogin();
  initAdminDashboard();
});
