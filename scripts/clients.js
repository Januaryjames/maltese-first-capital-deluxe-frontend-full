// v16 — Client auth + dashboard
const API_BASE = "/api";

// ----- Login -----
const loginForm = document.querySelector("#client-login");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(loginForm));
    const res = await fetch(`${API_BASE}/auth/client/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { alert(await res.text()); return; }
    const { token } = await res.json();
    localStorage.setItem("clientToken", token);
    location.href = "client-dashboard.html";
  });
}

// ----- Dashboard -----
const dashRoot = document.querySelector("#client-dashboard");
if (dashRoot) {
  const token = localStorage.getItem("clientToken");
  if (!token) { location.href = "client-login.html"; }

  const authed = (path) => fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => { if(!r.ok) throw new Error("Auth failed"); return r.json(); });

  (async () => {
    const me = await authed("/client/me");
    document.querySelector("#client-name").textContent = me.name || me.email;

    const select = document.querySelector("#account-select");
    me.accounts.forEach(a => {
      const o = document.createElement("option");
      o.value = a.number;
      o.textContent = `${a.currency} • ${a.number} — ${Number(a.balance).toFixed(2)}`;
      select.appendChild(o);
    });

    async function load(number) {
      const tx = await authed(`/client/accounts/${number}/transactions`);
      const acct = me.accounts.find(a => a.number === number);
      document.querySelector("#balance").textContent = acct ? Number(acct.balance).toFixed(2) : "0.00";
      const tbody = document.querySelector("#txn-body");
      tbody.innerHTML = tx.map(t => `
        <tr>
          <td>${new Date(t.createdAt).toLocaleString()}</td>
          <td>${t.type}</td>
          <td style="text-align:right">${Number(t.amount).toFixed(2)}</td>
          <td>${t.memo || ""}</td>
        </tr>`).join("");
    }

    if (me.accounts[0]) {
      select.value = me.accounts[0].number;
      await load(select.value);
    }

    select.addEventListener("change", e => load(e.target.value));
    document.querySelector("#client-logout").addEventListener("click", () => {
      localStorage.removeItem("clientToken");
      location.href = "client-login.html";
    });
  })().catch(() => {
    localStorage.removeItem("clientToken");
    location.href = "client-login.html";
  });
}
