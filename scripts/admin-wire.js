// scripts/admin-wire.js
// Read-only admin applications list + file download links.
// No visual changes: only renders if a known container exists.

(() => {
  const CFG = window.MFC || {};
  const API = CFG.API_BASE_URL || "";

  function $(s, r = document) { return r.querySelector(s); }
  async function api(path, opts = {}) {
    const token = localStorage.getItem('jwt');
    const headers = Object.assign(
      { Accept: 'application/json' },
      opts.headers || {},
      token ? { Authorization: `Bearer ${token}` } : {}
    );
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const txt = await res.text();
    let data; try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  function fmtDate(x) {
    try { return new Date(x).toLocaleString(); } catch { return x; }
  }

  function pickHost() {
    // Prefer common placeholders; otherwise do nothing (no visual changes).
    return (
      $('#admin-apps') ||
      $('pre#admin-apps') ||
      $('table#admin-apps tbody') ||
      null
    );
  }

  async function render() {
    if (!/admin-dashboard\.html/i.test(location.pathname)) return;
    const host = pickHost();
    if (!host) return; // no placeholder on the page → render nothing (no UI change)

    try {
      const { items } = await api('/api/admin/applications');
      // Decide render mode by host tag
      if (host.tagName === 'TBODY') {
        host.innerHTML = items.map(app => {
          const f = app.files || {};
          const fileCount = (f.companyDocs?.length || 0) + (f.passport?.length || 0) + (f.proofOfAddress?.length || 0) + (f.selfie?.length || 0);
          return `
            <tr>
              <td>${app.applicationId}</td>
              <td>${(app.fields?.companyName || '')}</td>
              <td>${(app.fields?.fullName || '')}</td>
              <td>${(app.fields?.email || '')}</td>
              <td>${fmtDate(app.createdAt)}</td>
              <td>${fileCount}</td>
            </tr>`;
        }).join('');
      } else if (host.tagName === 'PRE') {
        host.textContent = JSON.stringify(items.map(app => ({
          id: app.applicationId,
          company: app.fields?.companyName,
          name: app.fields?.fullName,
          email: app.fields?.email,
          when: app.createdAt,
          files: {
            companyDocs: (app.files?.companyDocs || []).length,
            passport: (app.files?.passport || []).length,
            proofOfAddress: (app.files?.proofOfAddress || []).length,
            selfie: (app.files?.selfie || []).length
          }
        })), null, 2);
      } else {
        // Generic container → simple cards (unstyled; inherited CSS only)
        host.innerHTML = (items || []).map(app => {
          const f = app.files || {};
          function link(field, file) {
            const gid = file.gridfsId;
            const url = `${API}/api/admin/applications/${app.applicationId}/files/${field}/${gid}`;
            const name = file.filename || field;
            return `<a href="${url}">${name}</a>`;
          }
          const parts = []
            .concat((f.companyDocs || []).map(fl => link('companyDocs', fl)))
            .concat((f.passport || []).map(fl => link('passport', fl)))
            .concat((f.proofOfAddress || []).map(fl => link('proofOfAddress', fl)))
            .concat((f.selfie || []).map(fl => link('selfie', fl)));

          return `
            <div data-app-id="${app.applicationId}">
              <div><strong>${app.fields?.companyName || '(no company)'}</strong> — ${app.fields?.fullName || ''}</div>
              <div>${app.fields?.email || ''} · ${fmtDate(app.createdAt)}</div>
              <div>Files: ${parts.join(' | ') || 'none'}</div>
              <hr/>
            </div>`;
        }).join('');
      }
    } catch (e) {
      // Fail silent (no new UI), but let admin see it if they open console.
      console.error('Admin apps render failed:', e);
    }
  }

  render();
})();
