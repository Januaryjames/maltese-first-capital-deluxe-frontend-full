// scripts/client-accounts-wire.js
(() => {
  const API = (window.MFC && window.MFC.API_BASE_URL) || '';
  const t = localStorage.getItem('jwt');
  if (!/client-dashboard\.html$/i.test(location.pathname) || !t) return;

  function $(s, r=document){ return r.querySelector(s); }
  const host = $('#accounts') || $('pre#accounts') || $('table#accounts tbody');
  if (!host) return;

  function fmt(n){ return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }

  fetch(`${API}/api/client/overview`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${t}` }
  })
  .then(r => r.json())
  .then(({accounts=[]}) => {
    if (host.tagName === 'PRE') {
      host.textContent = JSON.stringify(accounts, null, 2);
      return;
    }
    if (host.tagName === 'TBODY') {
      host.innerHTML = accounts.map(a => `
        <tr>
          <td>${a.accountNo}</td>
          <td>${a.currency || 'USD'}</td>
          <td>${fmt(a.balance || 0)}</td>
          <td>${a.status}</td>
        </tr>
      `).join('');
      return;
    }
    host.innerHTML = accounts.map(a => `
      <div data-acct="${a.accountNo}">
        <div><strong>${a.accountNo}</strong> — ${a.currency || 'USD'} ${fmt(a.balance || 0)}</div>
        <div>Status: ${a.status}</div>
        <hr>
      </div>
    `).join('');
  })
  .catch(err => console.error('client overview error', err));
})();
