// Maltese First Capital — MOCK STORE (v2)

// USERS (email -> profile/password)
const MFC_USERS = {
  "bejadbn1122@gmail.com": {
    name: "Bejad Bandoor A. Alharbi",
    authorisedPerson: "Bejadbn1122",
    holder: "Bejad Bandoor A. Alharbi",
    password: "MFC#Bejad2025!"
  },
  "almatsaderalfadhi@gmail.com": {
    name: "Abdulaziz Abdullah Al-Husseini",
    authorisedPerson: "Abdulaziz A. Al-Husseini",
    holder: "Al-Matsader Al-Fadhi Co",
    password: "MFC#Bejad2025!"
  }
};

// ACCOUNTS (email -> list of accounts)
const MFC_ACCOUNTS = {
  "bejadbn1122@gmail.com": [
    { accountNo: "91550872", currency: "USD", status: "active", balance: 0, lines: [] }
  ],
  "almatsaderalfadhi@gmail.com": [
    { accountNo: "91550873", currency: "USD", status: "active", balance: 0, lines: [] }
  ]
};

function normEmail(e){ return (e||"").trim().toLowerCase(); }

const MFC_API = {
  findUser(email){ return MFC_USERS[normEmail(email)] || null; },
  verify(email, pass){
    const u = this.findUser(email);
    return !!(u && u.password === pass);
  },
  overview(email){
    const u = this.findUser(email) || {};
    const accts = MFC_ACCOUNTS[normEmail(email)] || [];
    return {
      holder: u.holder || u.name || "",
      authorisedPerson: u.authorisedPerson || u.name || "",
      accounts: accts
    };
  }
};

// Expose for other scripts
window.MFC_MOCK = { USERS: MFC_USERS, ACCOUNTS: MFC_ACCOUNTS, API: MFC_API };

// Tiny auth helpers used by login/dashboard
window.MFC_AUTH = window.MFC_AUTH || {};
window.MFC_AUTH.login = async (email, password) => {
  if (MFC_API.verify(email, password)) {
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
  const user = MFC_API.findUser(email);
  return user ? { email, name: user.name } : null;
};
window.MFC_AUTH.overview = () => {
  const email = localStorage.getItem("mfc_email");
  return MFC_API.overview(email);
};
