<script>
// Maltese First Capital — MOCK STORE (v2)
// Drop this file at /scripts/mock-store.js and keep <script src="/scripts/mock-store.js?v=2"></script> on pages.

(() => {
  const USERS = {
    // Existing client (Bejad)
    "bejadbn1122@gmail.com": {
      name: "Bejad Bandoor A. Alharbi",
      authorisedPerson: "Bejadbn1122",
      holder: "Bejad Bandoor A. Alharbi",
      password: "MFC#Bejad2025!"
    },

    // NEW client (Al-Matsader Al-Fadhi Co)
    "almatsaderalfadhi@gmail.com": {
      name: "Abdulaziz Abdullah Al-Husseini",
      authorisedPerson: "Abdulaziz A. Al-Husseini",
      holder: "Al-Matsader Al-Fadhi Co",
      password: "MFC#Bejad2025!"
    }
  };

  const ACCOUNTS = {
    // Bejad — already issued previously
    "bejadbn1122@gmail.com": [
      {
        accountNo: "91550872",
        currency: "USD",
        status: "active",
        balance: 0,
        lines: [] // transactions
      }
    ],

    // NEW: Al-Matsader Al-Fadhi Co — zero balance
    "almatsaderalfadhi@gmail.com": [
      {
        accountNo: "91550873",
        currency: "USD",
        status: "active",
        balance: 0,
        lines: []
      }
    ]
  };

  // ---- tiny helpers used by the mock login & dashboard wires
  function normEmail(e){ return (e||"").trim().toLowerCase(); }

  const API = {
    findUser(email){ return USERS[normEmail(email)] || null; },
    verify(email, pass){
      const u = API.findUser(email);
      return !!(u && u.password === pass);
    },
    overview(email){
      const u = API.findUser(email) || {};
      const accts = ACCOUNTS[normEmail(email)] || [];
      return {
        holder: u.holder || u.name || "",
        authorisedPerson: u.authorisedPerson || u.name || "",
        accounts: accts
      };
    }
  };

  // Expose globally
  window.MFC_MOCK = { USERS, ACCOUNTS, API };

  // Convenience hooks used by your mock-auth.js / dashboard script
  window.MFC_AUTH = window.MFC_AUTH || {};
  window.MFC_AUTH.login = async (email, password) => {
    if (API.verify(email, password)) {
      localStorage.setItem("mfc_email", normEmail(email));
      localStorage.setItem("mfc_token", "mock-"+Date.now());
      return { ok: true };
    }
    return { ok: false, error: "Invalid credentials" };
  };
  window.MFC_AUTH.logout = () => {
    localStorage.removeItem("mfc_email");
    localStorage.removeItem("mfc_token");
  };
  window.MFC_AUTH.me = () => {
    const email = localStorage.getItem("mfc_email");
    const user = API.findUser(email);
    return user ? { email, name: user.name } : null;
  };
  window.MFC_AUTH.overview = () => {
    const email = localStorage.getItem("mfc_email");
    return API.overview(email);
  };
})();
</script>
