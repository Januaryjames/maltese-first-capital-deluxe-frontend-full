// scripts/admin.js v16
const API = (window.API_BASE || "https://maltese-first-capital-deluxe-backend.onrender.com").replace(/\/+$/,"");
const AEP = {
  login: `${API}/api/admin/login`,
  list:  `${API}/api/admin/clients`,
  createAcct: `${API}/api/admin/accounts`,
  postTx: `${API}/api/admin/transactions`
};

const tokenKey = "mfc.admin.jwt";
const setAuth = (t)=>localStorage.setItem(tokenKey,t);
const getAuth = ()=>localStorage.getItem(tokenKey);
const authHeader = ()=>({Authorization:`Bearer ${getAuth()}`});

// Admin login
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm){
  adminLoginForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const msg = document.getElementById("adminLoginMsg");
    msg.textContent = "Signing in…";
    try{
      const body = Object.fromEntries(new FormData(adminLoginForm).entries());
      const r = await fetch(AEP.login,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Login failed");
      setAuth(j.token);
      location.href = "admin-dashboard.html";
    }catch(err){ msg.textContent = "Error: "+err.message; }
  });
}

// Dashboard actions
const acctInput = document.getElementById("acctNumber");
if (acctInput) acctInput.value = Math.floor(10_000_000 + Math.random()*89_999_999).toString();

const createForm = document.getElementById("createAcctForm");
if (createForm){
  createForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const msg = document.getElementById("createAcctMsg");
    msg.textContent = "Creating…";
    try{
      const body = Object.fromEntries(new FormData(createForm).entries());
      if(!body.number || body.number.length!==8) throw new Error("8-digit account number required");
      const r = await fetch(AEP.createAcct,{method:"POST",headers:{...authHeader(),"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Failed");
      msg.textContent = `Created: ${j.currency} ${j.number} (balance ${j.balance})`;
    }catch(err){ msg.textContent = "Error: "+err.message; }
  });
}

const txForm = document.getElementById("postTxForm");
if (txForm){
  txForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const msg = document.getElementById("postTxMsg");
    msg.textContent = "Posting…";
    try{
      const body = Object.fromEntries(new FormData(txForm).entries());
      body.amount = Number(body.amount);
      const r = await fetch(AEP.postTx,{method:"POST",headers:{...authHeader(),"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Failed");
      msg.textContent = `OK. New balance: ${j.balance}`;
    }catch(err){ msg.textContent = "Error: "+err.message; }
  });
}

const adminList = document.getElementById("adminList");
if (adminList){
  (async ()=>{
    try{
      const r = await fetch(AEP.list,{headers:authHeader()});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Failed to fetch");
      adminList.innerHTML = j.map(c=>`<div class="helper">${c.email} • ${c.accounts?.length||0} account(s)</div>`).join("") || "No clients yet.";
    }catch(err){ adminList.textContent = "Error: "+err.message; }
  })();

  const logout = document.getElementById("adminLogout");
  if(logout) logout.addEventListener("click",(e)=>{e.preventDefault();localStorage.removeItem(tokenKey);location.href="admin-login.html";});
}
