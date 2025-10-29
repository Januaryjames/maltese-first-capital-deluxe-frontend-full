<!-- /scripts/api.js -->
<script>
// Lightweight API client used across pages
window.mfcApi = (function () {
  const keys = {
    token:  'MFC_TOKEN',
    client: 'MFC_CLIENT_ID',
    admin:  'MFC_IS_ADMIN'
  };

  function base() {
    // Primary: explicit global; Fallbacks: localStorage
    return window.API_BASE
        || localStorage.getItem('API_BASE')
        || localStorage.getItem('BACKEND_URL')
        || ''; // empty -> will throw with a clear message
  }

  async function request(method, path, body, { auth = true } = {}) {
    const url = base();
    if (!url) throw new Error('Backend not configured');

    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const t = localStorage.getItem(keys.token);
      if (!t) throw new Error('Not signed in');
      headers['Authorization'] = `Bearer ${t}`;
    }

    const res = await fetch(url + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      mode: 'cors'
    });

    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); msg = j.message || JSON.stringify(j); } catch {}
      throw new Error(msg || `HTTP ${res.status}`);
    }
    // Allow empty JSON
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  }

  return {
    keys,
    get:   (p, o) => request('GET',    p, null, o),
    post:  (p, b, o) => request('POST', p, b, o),
    patch: (p, b, o) => request('PATCH',p, b, o),
    del:   (p, o) => request('DELETE',  p, null, o)
  };
})();
</script>
