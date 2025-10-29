<script>
// ============ admin.js (KYC queue + approvals) ============

const BACKEND_URL = localStorage.getItem('BACKEND_URL') || '';
function needBackend() {
  if (!BACKEND_URL) { alert('Set BACKEND_URL via localStorage first.'); throw new Error('BACKEND_URL missing'); }
}
function authHeaders() {
  const token = localStorage.getItem('MFC_ADMIN_JWT') || localStorage.getItem('MFC_JWT') || '';
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function loadKycQueue() {
  try {
    needBackend();
    const res = await fetch(`${BACKEND_URL}/api/admin/kyc/pending`, { headers: { ...authHeaders() } });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to load KYC queue');

    const wrap = document.querySelector('[data-kyc-queue]');
    if (!wrap) return;

    wrap.innerHTML = (json.items || []).map(item => `
      <div class="panel">
        <div><strong>${item.fullName}</strong> — ${item.email}</div>
        <div>${item.nationality || ''} · ${item.phone || ''}</div>
        <div style="margin:.5rem 0">
          ${item.idDocUrl ? `<a class="btn outline" target="_blank" href="${item.idDocUrl}">ID Document</a>` : ''}
          ${item.proofAddrUrl ? `<a class="btn outline" target="_blank" href="${item.proofAddrUrl}">Proof of Address</a>` : ''}
        </div>
        <div class="form-row" style="margin-top:.5rem">
          <label>Initial Balance (optional):</label>
          <input type="number" step="0.01" data-init-for="${item._id}" placeholder="0.00" />
        </div>
        <div style="display:flex; gap:8px">
          <button class="btn gold" onclick="approveKyc('${item._id}')">Approve & Create Account</button>
          <button class="btn outline" onclick="rejectKyc('${item._id}')">Reject</button>
        </div>
      </div>
    `).join('') || '<div class="panel">No pending applications.</div>';

  } catch (err) {
    alert(err.message || 'Error loading queue');
  }
}

async function approveKyc(id) {
  try {
    needBackend();
    const initBalInput = document.querySelector(`input[data-init-for="${id}"]`);
    const initialBalance = initBalInput?.value ? Number(initBalInput.value) : undefined;

    const res = await fetch(`${BACKEND_URL}/api/admin/kyc/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ initialBalance })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Approval failed');

    alert(`Approved. Account ${json.accountNumber8} created.`);
    loadKycQueue();
  } catch (err) {
    alert(err.message || 'Approve failed');
  }
}

async function rejectKyc(id) {
  try {
    needBackend();
    const res = await fetch(`${BACKEND_URL}/api/admin/kyc/${id}/reject`, {
      method: 'POST',
      headers: { ...authHeaders() }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Reject failed');
    alert('Application rejected.');
    loadKycQueue();
  } catch (err) {
    alert(err.message || 'Reject failed');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'admin-kyc') {
    loadKycQueue();
  }
});
</script>
