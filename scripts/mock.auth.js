// /scripts/mock-auth.js
(() => {
  const CFG = window.MFC_MOCK || { USERS:{}, SESSION_HOURS:24, ALLOW_ANY_PASSWORD:false };

  function now(){ return Date.now(); }
  function hours(ms){ return ms * 60 * 60 * 1000; }
  function b64(s){ return (typeof btoa!=="undefined") ? btoa(s) : s; }
  function ub64(s){ return (typeof atob!=="undefined") ? atob(s) : s; }

  function saveSession(email){
    const exp = now() + hours(CFG.SESSION_HOURS || 24);
    const token = b64(JSON.stringify({ email, exp }));
    localStorage.setItem("mfc_token", token);
    return token;
  }

  function readSession(){
    const tok = localStorage.getItem("mfc_token");
    if(!tok) return null;
    try{
      const { email, exp } = JSON.parse(ub64(tok));
      if(!email || !exp || now()>exp) { localStorage.removeItem("mfc_token"); return null; }
      return { token: tok, email };
    }catch{ localStorage.removeItem("mfc_token"); return null; }
  }

  function logout(){
    localStorage.removeItem("mfc_token");
  }

  function assertUser(email){
    const user = (CFG.USERS||{})[String(email||"").toLowerCase()];
    if(!user) throw new Error("User not found");
    return user;
  }

  async function login(email, password){
    email = String(email||"").toLowerCase().trim();
    const user = assertUser(email);

    if(!CFG.ALLOW_ANY_PASSWORD){
      if(!password || password !== user.password){
        return { ok:false, error:"Invalid credentials" };
      }
    }
    const token = saveSession(email);
    return { ok:true, token, user: { email, name:user.name } };
  }

  async function me(token){
    const sess = readSession();
    if(!sess || (token && token!==sess.token)) return { ok:false, error:"Unauthenticated" };
    const u = assertUser(sess.email);
    return { ok:true, user:{ email:sess.email, name:u.name } };
  }

  async function overview(token){
    const sess = readSession();
    if(!sess || (token && token!==sess.token)) return { ok:false, error:"Unauthenticated" };
    const u = assertUser(sess.email);
    const acct = u.account || null;
    return {
      ok:true,
      data:{
        holder: u.holder || u.name,
        authorisedPerson: u.authorisedPerson || (sess.email.split("@")[0]),
        accounts: acct ? [acct] : []
      }
    };
  }

  window.MFC_AUTH = { login, me, overview, logout, _readSession:readSession };
})();
