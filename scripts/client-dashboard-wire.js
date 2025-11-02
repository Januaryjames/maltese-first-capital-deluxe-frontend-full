// scripts/client-dashboard.js — minimal fix to display holderName
(() => {
  const API = (window.__MFC_CONFIG && window.__MFC_CONFIG.API_BASE_URL) 
            || 'https://maltese-first-capital-deluxe-backend.onrender.com';

  const $ = (s, r=document) => r.querySelector(s);
  function fmtUsd(n){ return 'US$' + (Number(n||0)).toFixed(2); }

  async function load() {
    const token = localStorage.getItem('mfc_client_jwt');
    if (!token) {
      location.href = '/client-login.html?next=' + encodeURIComponent(location.pathname);
      return;
    }

    const r = await fetch(API + '/api/client/overview', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!r.ok) { localStorage.removeItem('mfc_client_jwt'); location.href='/client-login.html'; return; }

    const j = await r.json();
    const acct = (j.accounts && j.accounts[0]) || null;

    // Targets in client-dashboard.html
    const elHolder   = $('#accHolder');      // Account Holder value
    const elNumber   = $('#accNumber');      // Account Number value
    const elStatus   = $('#accStatus');      // Status pill
    const elCurrency = $('#accCurrency');    // Currency
    const elBalance  = $('#accBalance');     // Balance
    const txBody     = $('#txBody');         // <tbody> for recent txns (optional)

    if (!acct) {
      if (elHolder)   elHolder.textContent   = '—';
      if (elNumber)   elNumber.textContent   = '—';
      if (elStatus)   elStatus.textContent   = 'not_activated';
      if (elCurrency) elCurrency.textContent = 'USD';
      if (elBalance)  elBalance.textContent  = fmtUsd(0);
      return;
    }

    if (elHolder)   elHolder.textContent   = acct.holderName || '—';       // <-- COMPANY NAME
    if (elNumber)   elNumber.textContent   = acct.accountNo || '—';
    if (elStatus)   elStatus.textContent   = acct.status || '—';
    if (elCurrency) elCurrency.textContent = acct.currency || 'USD';
    if (elBalance)  elBalance.textContent  = fmtUsd(acct.balance);

    // Optional: recent transactions (if you have <tbody id="txBody">)
    if (txBody) {
      txBody.innerHTML = '';
      (acct.lines || []).slice(-10).reverse().forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(l.ts).toLocaleString()}</td>
          <td>${l.type}</td>
          <td>${l.description || ''}</td>
          <td class="${l.type==='debit'?'text-red-400':'text-green-400'}">${fmtUsd(l.amount)}</td>`;
        txBody.appendChild(tr);
      });
    }
  }

  // Logout link (if present)
  const logout = document.querySelector('#logoutLink');
  if (logout) logout.addEventListener('click', () => {
    localStorage.removeItem('mfc_client_jwt');
    location.href = '/client-login.html';
  });

  document.addEventListener('DOMContentLoaded', load);
})();
