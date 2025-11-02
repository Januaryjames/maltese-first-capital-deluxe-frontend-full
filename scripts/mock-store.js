<!-- /scripts/mock-store.js -->
<script>
window.MFC_MOCK = window.MFC_MOCK || {
  // Global toggles
  ALLOW_ANY_PASSWORD: false,
  SESSION_HOURS: 24,

  // Canonical client list (email → profile)
  USERS: {
    // Example entry — delete/replace when you send real data
    "bejadbn1122@gmail.com": {
      password: "MFC#Bejad2025!",
      name: "Bejad Bandoor A. Alharbi",           // login name
      authorisedPerson: "Bejadbn1122",            // shows on dashboard
      holder: "Nab’ al-Khayrat For Trading",      // company / account holder
      account: {
        accountNo: "91550872",
        status: "active",                          // active | not_activated | suspended
        currency: "USD",
        balance: 0,
        lines: [
          // { ts:"2025-11-02T10:45:00Z", type:"credit", amount:5000000, currency:"USD", description:"Loan Credit (Pending Activation)" }
        ]
      }
    }
  },

  // Helpers (so we can add/maintain without breaking shape)
  addUser(entry) {
    const req = ["email","password","name","authorisedPerson","holder","account"];
    if (!entry || !req.every(k => entry[k])) throw new Error("Invalid user payload");
    if (!entry.account.accountNo) throw new Error("account.accountNo required");
    this.USERS[entry.email.toLowerCase()] = entry;
    return true;
  },

  updatePassword(email, newPass) {
    const u = this.USERS[email?.toLowerCase()];
    if (!u) throw new Error("User not found");
    u.password = newPass;
    return true;
  }
};
</script>
