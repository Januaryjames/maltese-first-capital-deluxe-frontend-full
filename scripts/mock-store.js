// /scripts/mock-store.js — v3 (no <script> tags)
(function (w) {
  // Add clients here
  const USERS = {
    "bejadbn1122@gmail.com": {
      email: "bejadbn1122@gmail.com",
      name: "Bejad Bandoor A. Alharbi",
      password: "MFC#Bejad2025!",                 // fixed login
      holder: "Nab' al-Khayrat For Trading",      // company account holder
      authorisedPerson: "Bejadbn1122",            // shown on dashboard
      account: {
        accountNo: "91550872",
        currency: "USD",
        status: "active",
        balance: 0,
        lines: [
          // example row:
          // { ts: "2025-11-01T12:00:00Z", type: "credit", amount: 0, description: "Account opened", currency: "USD" }
        ]
      }
    }
  };

  const store = {
    VERSION: "2025-11-02T15:45Z",
    USERS,
    ALLOW_ANY_PASSWORD: false, // flip to true if you ever want password ignored
    upsertUser(u) {
      const e = (u.email || "").toLowerCase();
      if (!e) throw new Error("email required");
      USERS[e] = { ...(USERS[e] || {}), ...u, email: e };
      return USERS[e];
    },
    updatePassword(email, next) {
      const e = (email || "").toLowerCase();
      if (!USERS[e]) throw new Error("user not found");
      USERS[e].password = next;
      return true;
    }
  };

  w.MFC_MOCK = store;
})(window);
