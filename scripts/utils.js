<script>
  window.apiFetch = async function(path, opts = {}) {
    const base = window.CONFIG?.API_BASE_URL || '';
    const token = localStorage.getItem('jwt');
    const headers = Object.assign(
      {'Accept': 'application/json'},
      opts.headers || {},
      token ? {'Authorization': `Bearer ${token}`} : {}
    );
    const res = await fetch(`${base}${path}`, { ...opts, headers });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  };

  window.showError = (msg) => {
    alert(msg || 'Something went wrong');
  };
</script>
