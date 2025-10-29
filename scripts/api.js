<script>
/* Minimal API client for MFC */
(() => {
  const DEFAULT_BASE = 'https://maltese-first-capital-deluxe-backend.onrender.com';
  const LS = localStorage;

  window.API_BASE = LS.getItem('API_BASE') || DEFAULT_BASE;

  const keys = {
    token:  'mfc_token',
    client: 'mfc_client_id',
    admin:  'mfc_admin'
  };

  async function api(path, { method='GET', body, auth=true, headers={}, ...rest } = {}) {
    const opts = { method, headers: { 'Content-Type':'application/json', ...headers }, ...rest };
    if (auth) {
      const t = LS.getItem(keys.token);
      if (t) opts.headers['Authorization'] = `Bearer ${t}`;
    }
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${window.API_BASE}${path}`, opts);
    if (res.status === 401) {
      // kick to appropriate login
      LS.removeItem(keys.token);
      if (location.pathname.includes('admin')) location.href = '/admin-login.html';
      else location.href = '/client-login.html';
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      let msg = '';
      try { const j = await res.json(); msg = j.message || JSON.stringify(j); } catch { msg = await res.text(); }
      throw new Error(`${res.status} ${msg}`);
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  window.mfcApi = {
    setBase(u){ LS.setItem('API_BASE', u); window.API_BASE = u; },
    getBase(){ return window.API_BASE; },
    keys,
    get:  (p,o)=>api(p,{method:'GET', ...(o||{})}),
    post: (p,b,o)=>api(p,{method:'POST', body:b, ...(o||{})}),
    patch:(p,b,o)=>api(p,{method:'PATCH',body:b, ...(o||{})}),
    del:  (p,o)=>api(p,{method:'DELETE', ...(o||{})})
  };
})();
</script>
