// scripts/forms.js v16
// Change this if your backend URL ever changes:
const API_BASE = (window.API_BASE || "https://maltese-first-capital-deluxe-backend.onrender.com").replace(/\/+$/,"");
const EP = {
  contact: `${API_BASE}/api/public/contact`,
  apply:   `${API_BASE}/api/public/account`,     // KYC application (multipart)
  login:   `${API_BASE}/api/auth/client/login`,
  me:      `${API_BASE}/api/client/me`,
  accounts:`${API_BASE}/api/client/accounts`,
  tx:      (id)=>`${API_BASE}/api/client/accounts/${id}/transactions`
};

// CONTACT
const contactForm = document.getElementById("contactForm");
if (contactForm){
  contactForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(contactForm).entries());
    const msg = document.getElementById("contactMsg");
    msg.textContent = "Sending…";
    try{
      const r = await fetch(EP.contact,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Failed");
      msg.textContent = "Thank you. We’ll reply to your email.";
      contactForm.reset();
    }catch(err){ msg.textContent = "Error: "+err.message; }
  });
}

// KYC APPLY
const kycForm = document.getElementById("kycForm");
if (kycForm){
  kycForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const fd = new FormData(kycForm);
    const msg = document.getElementById("kycMsg");
    msg.textContent = "Uploading & submitting…";
    try{
      const r = await fetch(EP.apply,{method:"POST",body:fd});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Submission failed");
      msg.textContent = "Submitted. Compliance will contact you shortly.";
      kycForm.reset();
    }catch(err){ msg.textContent = "Error: "+err.message; }
  });
}

// CLIENT LOGIN
const clientLoginForm = document.getElementById("clientLoginForm");
if (clientLoginForm){
  clientLoginForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const msg = document.getElementById("clientLoginMsg");
    msg.textContent = "Signing in…";
    try{
      const body = Object.fromEntries(new FormData(clientLoginForm).entries());
      const r = await fetch(EP.login,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const j = await r.json(); if(!r.ok) throw new Error(j.error||"Login failed");
      localStorage.setItem("mfc.jwt", j.token);
      location.href = "client-dashboard.html";
    }catch(err){ msg.textContent = "Error: "+err.message; }
  });
}

// CLIENT DASHBOARD
window.ClientDash = {
  async init(){
    const token = localStorage.getItem("mfc.jwt");
    if(!token){ location.href="client-login.html"; return; }
    const auth = { Authorization:`Bearer ${token}` };

    const me = await fetch(EP.me,{headers:auth}).then(r=>r.json()).catch(()=>null);
    if(me && me.name) document.getElementById("welcome").textContent = `Welcome, ${me.name}`;

    const accounts = await fetch(EP.accounts,{headers:auth}).then(r=>r.json()).catch(()=>[]);
    const wrap = document.getElementById("accountCards"); wrap.innerHTML="";
    const firstId = accounts[0]?.id;

    accounts.forEach(a=>{
      const div = document.createElement("div");
      div.className="card";
      div.innerHTML = `
        <h3>${a.currency} • ${a.number}</h3>
        <p class="helper">Available Balance</p>
        <h2 style="margin:6px 0">${a.balance?.toLocaleString?.('en-US',{style:'currency',currency:a.currency}) ?? a.balance}</h2>
      `;
      wrap.appendChild(div);
    });

    if(firstId){
      const tx = await fetch(EP.tx(firstId),{headers:auth}).then(r=>r.json()).catch(()=>[]);
      const body = document.getElementById("txBody"); body.innerHTML="";
      tx.forEach(t=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${new Date(t.date).toLocaleDateString()}</td>
          <td>${t.accountNumber}</td>
          <td>${t.description||''}</td>
          <td align="right">${(t.amount>=0?'+':'')}${t.amount.toFixed(2)}</td>
          <td align="right">${t.balanceAfter?.toFixed?.(2) ?? ''}</td>
        `;
        body.appendChild(tr);
      });
    }

    const btn = document.getElementById("logoutBtn");
    if(btn) btn.addEventListener("click", (e)=>{ e.preventDefault(); localStorage.removeItem("mfc.jwt"); location.href="index.html"; });
  }
};
