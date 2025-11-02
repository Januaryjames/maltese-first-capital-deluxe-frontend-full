<!-- this is a JS file; I'm showing it inline so you can copy-paste -->
<script>
// /scripts/mock-store.js — v2
(function (w) {
  // MASTER USER LIST (add more clients here)
  const USERS = {
    "bejadbn1122@gmail.com": {
      email: "bejadbn1122@gmail.com",
      name: "Bejad Bandoor A. Alharbi",
      // keep the fixed password you wanted:
      password: "MFC#Bejad2025!",
      // what the dashboard shows
      holder: "Nab' al-Khayrat For Trading",
      authorisedPerson: "Bejadbn1122",
      account: {
        accountNo: "91550872",
        currency: "USD",
        status: "active",
        balance: 0,
        lines: [
          // sample format if you add any:
          // { ts: "2025-11-01T12:00:00Z", type: "credit", amount: 0, description: "Account opened", currency: "USD" }
        ]
      }
    }
  };

  const store = {
    VERSION: "2025-11-02-15:40",
    SESSION_HOURS: 72,
    ALLOW_ANY_PASSWORD: false, // set true if you want to ignore password checks
    USERS,
    updatePassword(email, next) {
      const e = (email || "").toLowerCase();
      if (!USERS[e]) throw new Error("User not found");
      USERS[e].password = next;
      return true;
    },
    upsertUser(obj) {
      const e = (obj.email || "").toLowerCase();
      if (!e) throw new Error("email required");
      USERS[e] = { ...(USERS[e] || {}), ...obj, email: e };
      return USERS[e];
    }
  };

  w.MFC_MOCK = store;
})(window);
</script>
