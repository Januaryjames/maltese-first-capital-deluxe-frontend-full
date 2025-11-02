// Loads and renders client accounts on the dashboard
(() => {
  const fmtMoney = (n, c='USD') => `${c} ${Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  document.addEventListener('DOMContentLoaded', async () => {
    const ok = await MFC.requireClient(); if (!ok) return;

    const list   = document.querySelector('#accountsList');
    const nameEl = document.querySelector('#clientName');
    const me     = MFC.getUser();

    if (nameEl) nameEl.textContent = me?.name || me?.email || 'Client';
    if (list) list.innerHTML = `<div class="muted">Loading…</div>`;

    try {
      const r = await MFC.authFetch('/api/client/overview');
      const d = await r.json().catch(()=> ({}));
      if (!r.ok) throw new Error(d.error || 'Failed to load accounts');

      const rows = d.accounts || [];
      if (!rows.length) { list && (list.innerHTML = `<div class="muted">No accounts yet.</div>`); return; }

      const html = rows.map(a => `
        <div class="card" style="padding:12px;margin:10px 0;border-radius:12px;border:1px solid #2c2c2c;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:600;">Account • ${a.accountNo}</div>
            <div style="font-size:.9em;opacity:.8;">${new Date(a.createdAt||Date.now()).toLocaleString()}</div>
          </div>
          <div style="margin-top:6px;">Status: <b>${a.status}</b></div>
          <div>Balance: <b>${fmtMoney(a.balance, a.currency)}</b></div>
        </div>
      `).join('');

      list && (list.innerHTML = html);
    } catch (e) {
      list && (list.innerHTML = `<div class="error">Could not load accounts. ${e.message||e}</div>`);
    }
  });
})();
