<!-- /scripts/api.js -->
<script>
(() => {
  const BACKEND_URL = window.MFC_API_BASE || "https://maltese-first-capital-deluxe-backend.onrender.com";
  const TOKEN_KEY = "mfc_token";
  const PROFILE_KEY = "mfc_profile";

  const storage = {
    get token(){ return localStorage.getItem(TOKEN_KEY); },
    set token(v){ v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); },
    get profile(){ try{ return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); }catch{ return null; } },
    set profile(o){ o ? localStorage.setItem(PROFILE_KEY, JSON.stringify(o)) : localStorage.removeItem(PROFILE_KEY); },
    clear(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(PROFILE_KEY); }
  };

  async function fetchJSON(path, {method="GET", body=null, auth=true, headers={}} = {}) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 12000);
    const h = {"Content-Type":"application/json", ...headers};
    if (auth && storage.token) h.Authorization = `Bearer ${storage.token}`;
    const res = await fetch(`${BACKEND_URL}${path}`, {method, headers:h, body, mode:"cors", credentials:"omit", signal:ctrl.signal});
    clearTimeout(id);
    if (!res.ok) {
      const text = await res.text().catch(()=> "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    const type = res.headers.get("content-type") || "";
    return type.includes("application/json") ? res.json() : res.text();
  }

  async function login(email, password){
    try {
      const data = await fetchJSON("/api/auth/login", {
        method:"POST",
        auth:false,
        body: JSON.stringify({email, password})
      });
      if (data?.token) storage.token = data.token;
      if (data?.client) storage.profile = data.client;
      return data;
    } catch (e) {
      // fallback: demo login (for testing without API)
      if (email === "demo@maltesefirst.com" && password === "demo123") {
        const demo = {
          token: "demo-token",
          client: {
            name: "Demo Client",
            email,
            accountNumber: "83-104-52",
            balances: [
              {currency:"EUR", amount: 152340.19},
              {currency:"USD", amount: 43890.00}
            ],
            transactions: [
              {id:"TX-10041", date:"2025-10-21", description:"Incoming Wire", amount: 25000.00, currency:"EUR"},
              {id:"TX-10040", date:"2025-10-18", description:"Card Settlement", amount:-189.50, currency:"EUR"},
              {id:"TX-10039", date:"2025-10-17", description:"FX EUR→USD", amount:-5000.00, currency:"EUR"}
            ]
          }
        };
        storage.token = demo.token;
        storage.profile = demo.client;
        return demo;
      }
      throw e;
    }
  }

  async function getOverview(){
    // Prefer a consolidated endpoint; gracefully fall back to /profile + /accounts
    try {
      const data = await fetchJSON("/api/clients/overview");
      if (data?.client) storage.profile = data.client;
      return data?.client ?? data;
    } catch {
      const profile = await fetchJSON("/api/clients/profile").catch(()=> null);
      if (profile) {
        storage.profile = profile;
        return profile;
      }
      // last-ditch: cached
      if (storage.profile) return storage.profile;
      throw new Error("Unable to load profile.");
    }
  }

  async function logout(){
    try { await fetchJSON("/api/auth/logout").catch(()=>{}); } finally { storage.clear(); }
  }

  // Expose globally
  window.MFC_API = { BACKEND_URL, storage, fetchJSON, login, getOverview, logout };
})();
</script>
