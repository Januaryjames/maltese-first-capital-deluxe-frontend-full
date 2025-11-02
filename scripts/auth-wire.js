// Auth + API helpers (shared across pages)
(() => {
  const API = (window.__MFC_CONFIG?.API_BASE_URL || '').replace(/\/+$/,'');
  if (!API) console.warn('[MFC] Missing API_BASE_URL');

  window.MFC = window.MFC || {};
  MFC.apiBase = API;

  MFC.saveAuth = (token, user) => {
    localStorage.setItem('mfc_token', token);
    localStorage.setItem('mfc_user', JSON.stringify(user || {}));
  };
  MFC.getToken = () => localStorage.getItem('mfc_token') || '';
  MFC.getUser  = () => { try { return JSON.parse(localStorage.getItem('mfc_user')||'{}'); } catch { return {}; } };
  MFC.logout   = () => { localStorage.removeItem('mfc_token'); localStorage.removeItem('mfc_user'); location.href='/client-login.html'; };

  MFC.authFetch = (path, opts = {}) => {
    const headers = Object.assign({}, opts.headers || {});
    const t = MFC.getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
    return fetch(API + path, Object.assign({}, opts, { headers }));
  };

  MFC.requireClient = async () => {
    const t = MFC.getToken();
    if (!t) { location.href = '/client-login.html?next=' + encodeURIComponent(location.pathname); return false; }
    try {
      const r = await MFC.authFetch('/api/auth/me');
      if (!r.ok) throw 0;
      const d = await r.json();
      if (d?.user?.role !== 'client') throw 0;
      return true;
    } catch {
      MFC.logout(); return false;
    }
  };
})();
