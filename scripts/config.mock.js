// /scripts/config.mock.js
// Static multi-client registry. One account per client.
// Enforces real passwords (ALLOW_ANY_PASSWORD=false).

window.MFC_MOCK = {
  ALLOW_ANY_PASSWORD: false,
  SESSION_HOURS: 24,

  USERS: {
    // ---- Client #1 (Bejad) ----
    "bejadbn1122@gmail.com": {
      password: "MFC#Bejad2025!",
      name: "Bejad Bandoor A. Alharbi",
      authorisedPerson: "Bejadbn1122",
      holder: "Nab’ al-Khayrat For Trading",
      account: {
        accountNo: "91550872",
        status: "active",
        currency: "USD",
        balance: 0,
        lines: [
          // Optional example lines:
          // { ts:"2025-11-02T09:00:00Z", type:"credit", amount:250000, description:"Initial funding", currency:"USD" },
          // { ts:"2025-11-02T14:00:00Z", type:"debit",  amount:1500,   description:"Compliance fee",  currency:"USD" }
        ]
      }
    },

    // ---- Add more clients like this ----
    "client2@example.com": {
      password: "Strong#Pass2025!",
      name: "Client Two",
      authorisedPerson: "clienttwo",
      holder: "Client Two Holdings Ltd",
      account: {
        accountNo: "20251234",
        status: "active",
        currency: "USD",
        balance: 0,
        lines: []
      }
    }

    // …add as many as you like, one block per email.
  }
};
