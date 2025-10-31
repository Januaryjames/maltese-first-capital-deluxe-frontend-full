<script>
// Frontend wiring: invisible Turnstile + login + onboarding + contact
(function(){
  const CFG = (window.MFC||{});
  const API = CFG.API_BASE_URL || "";
  const SITE_KEY = CFG.TURNSTILE_SITE_KEY || "";

  // ---------- helpers ----------
  async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem('jwt');
    const headers = Object.assign(
      {'Accept':'application/json'},
      opts.headers||{},
      token ? {'Authorization':`Bearer ${token}`} : {}
    );
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const text = await res.text();
    let data; try{ data = text ? JSON.parse(text) : null; } catch { data = { raw:text }; }
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  function $(sel, root=document){ return root.querySelector(sel); }

  // ---------- Turnstile (invisible) ----------
  function loadTurnstile(){
    if (!SITE_KEY) return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src='https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async=true; s.defer=true; s.onload=()=>resolve(window.turnstile||null);
      document.head.appendChild(s);
    });
  }

  // Returns a promise that resolves to a token when you call exec()
  async function attachInvisibleTurnstile(form){
    if (!SITE_KEY) return { exec: async()=>"" }; // no-op
    await loadTurnstile();

    // hidden holder (no visual changes)
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    form.appendChild(holder);

    let hidden = form.querySelector('input[name="cf_turnstile_response"]');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'cf_turnstile_response';
      form.appendChild(hidden);
    }

    const wid = window.turnstile.render(holder, {
      sitekey: SITE_KEY,
      size: 'invisible',
      callback: function(token){
        hidden.value = token;
        pendingResolve && pendingResolve(token);
        pendingResolve = null;
      }
    });

    let pendingResolve = null;
    return {
      exec: () => {
        return new Promise((resolve)=>{
          pendingResolve = resolve;
          try { window.turnstile.execute(wid); }
          catch { resolve(""); } // graceful fallback
        });
      },
      reset: () => { try { window.turnstile.reset(wid); } catch {} hidden.value=""; }
    };
  }

  // ---------- Bind: Client Login ----------
  (async function bindClientLogin(){
    const form = document.querySelector('#client-login-form') || null;
    if (!form) return;

    const emailEl = form.querySelector('input[type="email"], input[name*="email" i]');
    const passEl  = form.querySelector('input[type="password"], input[name*="password" i]');
    const ts = await attachInvisibleTurnstile(form); // optional on login

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        // If you want Turnstile on login too, uncomment:
        // await ts.exec();
        const email = (emailEl && emailEl.value || '').trim();
        const password = passEl && passEl.value || '';
        const data = await apiFetch('/api/auth/login', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt', data.token);
        window.location.href = '/client-dashboard.html';
      }catch(err){ alert(err.message); }
      finally { ts.reset && ts.reset(); }
    });
  })();

  // ---------- Bind: Admin Login ----------
  (async function bindAdminLogin(){
    const form = document.querySelector('#admin-login-form') || null;
    if (!form) return;

    const emailEl = form.querySelector('input[type="email"], input[name*="email" i]');
    const passEl  = form.querySelector('input[type="password"], input[name*="password" i]');
    const ts = await attachInvisibleTurnstile(form); // optional on login

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        // await ts.exec(); // enable if you want captcha on admin login
        const email = (emailEl && emailEl.value || '').trim();
        const password = passEl && passEl.value || '';
        const data = await apiFetch('/api/admin/login', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt', data.token);
        window.location.href = '/admin-dashboard.html';
      }catch(err){ alert(err.message); }
      finally { ts.reset && ts.reset(); }
    });
  })();

  // ---------- Bind: Account Open (KYC) ----------
  (async function bindOnboarding(){
    const form = document.querySelector('#onboarding-form') || null;
    if (!form) return;

    const ts = await attachInvisibleTurnstile(form);

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        const token = await ts.exec(); // REQUIRED on KYC
        if (!token) throw new Error('Captcha verification failed — please retry.');
        const fd = new FormData(form); // includes cf_turnstile_response
        const data = await apiFetch('/api/onboarding/submit', { method:'POST', body: fd });
        alert(`Application received. ID: ${data.applicationId}`);
        form.reset(); ts.reset();
      }catch(err){ alert(err.message); }
    });
  })();

  // ---------- Bind: Contact (stub until /api/contact exists) ----------
  (async function bindContact(){
    const form = document.querySelector('#contact-form') || null;
    if (!form) return;

    const ts = await attachInvisibleTurnstile(form);

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        await ts.exec(); // we check a token even if we don't send it anywhere yet
        alert('Thanks—your message has been noted.');
        form.reset(); ts.reset();
        // If/when you add /api/contact, post here with FormData like the KYC flow.
      }catch(err){ alert(err.message); }
    });
  })();

  // ---------- Optional: client dashboard data ----------
  (function hydrateClientDashboard(){
    if (!/client-dashboard\.html/i.test(location.pathname)) return;
    const pre = document.querySelector('#accounts, pre#accounts');
    if (!pre) return;
    apiFetch('/api/client/overview').then(
      d => { try { pre.textContent = JSON.stringify(d.accounts, null, 2); } catch {} },
      e => alert(e.message)
    );
  })();

})();
</script>
