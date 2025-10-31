// scripts/auth-guard.js — redirects to the right login if token missing/role mismatch.
(() => {
  const CFG = (window.MFC || {});
  const API = CFG.API_BASE_URL || "";

  async function api(path) {
    const t = localStorage.getItem('jwt');
    const res = await fetch(`${API}${path}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  const needClient = [/^\/client-(dashboard|profile|overview)\.html$/i];
  const needAdmin  = [/^\/admin-(dashboard|kyc|docs)\.html$/i];

  function matches(list){ return list.some(rx => rx.test(location.pathname)); }

  (async () => {
    const wantsClient = matches(needClient);
    const wantsAdmin  = matches(needAdmin);
    if (!wantsClient && !wantsAdmin) return;

    try {
      const { user } = await api('/api/auth/me');
      if (wantsClient && user.role !== 'client') throw new Error('403');
      if (wantsAdmin && user.role !== 'admin') throw new Error('403');
      // ok
    } catch {
      if (wantsAdmin) location.href = '/admin-login.html';
      else location.href = '/client-login.html';
    }
  })();
})();
