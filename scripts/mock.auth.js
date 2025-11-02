// /scripts/mock-auth.js
(() => {
  const SKEY = "mfc_session_v1";
  const AKEY = "mfc_last_account_index"; // remembers last selected account

  const now = () => Date.now();
  const addHours = h => now() + h * 3600 * 1000;

  function saveSession(session){ localStorage.setItem(SKEY, JSON.stringify(session)); }
  function loadSession(){
    try {
      const raw = localStorage.getItem(SKEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.expiresAt || s.expiresAt < now()) { localStorage.removeItem(SKEY); return null; }
      return s;
    } catch { return null; }
  }
  function clearSession(){ localStorage.removeItem(SKEY); localStorage.removeItem(AKEY); }

  async function login(email, password){
    const cfg = window.MFC_MOCK || {};
    const user = cfg.USERS?.[String(email||"").toLowerCase()];
    if (!user) return { ok:false, error:"Unknown user" };
    if (!cfg.ALLOW_ANY_PASSWORD && String(password||"") !== String(user.password||"")){
      return { ok:false, error:"Invalid credentials" };
    }
    const session = {
      email: String(email).toLowerCase(),
      issuedAt: now(),
      expiresAt: addHours(cfg.SESSION_HOURS || 24)
    };
    saveSession(session);
    return { ok:true, session };
  }

  function requireSession(){
    const s = loadSession();
    if (!s) window.location.href = "/client-login.html";
    return s;
  }

  function getUser(email){
    const cfg = window.MFC_MOCK || {};
    return cfg.USERS?.[String(email||"").toLowerCase()] || null;
  }

  function getAccount(user, index){
    const list = user?.accounts || user?.account && [user.account] || [];
    if (!list.length) return null;
    const i = Math.min(Math.max( parseInt(index ?? loadLastAccountIndex(), 10 ) || 0, 0), list.length-1);
    return { account: list[i], index: i, total: list.length };
  }

  function saveLastAccountIndex(i){ localStorage.setItem(AKEY, String(i)); }
  function loadLastAccountIndex(){ return localStorage.getItem(AKEY); }

  function fmtMoney(n, ccy="USD"){
    if (typeof n !== "number") return "—";
    return n.toLocaleString(undefined, { style:"currency", currency:ccy });
  }
  function renderTx(lines, ccy){
    if (!Array.isArray(lines) || !lines.length) return `<div class="k">No transactions yet.</div>`;
    const rows = lines.slice().sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,20).map(l=>{
      const sign = l.type === "debit" ? -1 : 1;
      const cls = sign < 0 ? "neg" : "pos";
      const amt = fmtMoney(sign * Number(l.amount||0), l.currency || ccy || "USD");
      const when = l.ts ? new Date(l.ts).toLocaleString() : "—";
      return `<tr><td>${when}</td><td>${l.description||l.type||"-"}</td><td class="amt ${cls}">${amt}</td></tr>`;
    }).join("");
    return `<table><thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  window.MFC_AUTH = {
    login, loadSession, clearSession, requireSession, getUser,
    getAccount, saveLastAccountIndex, fmtMoney, renderTx
  };
})();
