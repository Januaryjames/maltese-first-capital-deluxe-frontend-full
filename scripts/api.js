<script>
(() => {
  // ===== Minimal API client for MFC front-end =====
  const DEFAULT_BASE = 'https://maltese-first-capital-deluxe-backend.onrender.com';

  window.API_BASE = localStorage.getItem('API_BASE') || DEFAULT_BASE;

  const tokenKey  = 'mfc_token';
  const clientKey = 'mfc_client_id';
  const adminKey  = 'mfc_admin';

  async function api(path, { method='GET', body, auth=true, headers={}, ...rest } = {}) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      ...rest
    };
    if (auth) {
      const tok = localStorage.getItem(tokenKey);
      if (tok) opts.headers['Authorization'] = `Bearer ${tok}`;
    }
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${window.API_BASE}${path}`, opts);

    if (res.status === 401) {
      localStorage.removeItem(tokenKey);
      if (location.pathname.includes('admin')) location.href = '/admin-login.html';
      else location.href = '/client-login.html';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  // Expose helpers
  window.mfcApi = {
    setBase(u){ localStorage.setItem('API_BASE', u); window.API_BASE = u; },
    getBase(){ return window.API_BASE; },
    tokenKey, clientKey, adminKey,
    get:   (p,o)   => api(p, { method:'GET',   ...(o||{}) }),
    post:  (p,b,o) => api(p, { method:'POST',  body:b, ...(o||{}) }),
    patch: (p,b,o) => api(p, { method:'PATCH', body:b, ...(o||{}) }),
    del:   (p,o)   => api(p, { method:'DELETE', ...(o||{}) })
  };
})();
</script>
