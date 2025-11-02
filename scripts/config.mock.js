// /scripts/config.mock.js
// Static, no-backend config. Ready for multiple users & multiple accounts.
// Passwords are enforced (ALLOW_ANY_PASSWORD = false).

window.MFC_MOCK = {
  ALLOW_ANY_PASSWORD: false,            // ← enforce passwords
  SESSION_HOURS: 24,                    // session lifetime

  USERS: {
    // --- Client 1: Bejad ---
    "bejadbn1122@gmail.com": {
      password: "MFC#Bejad2025!",       // ← as requested
      name: "Bejad Bandoor A. Alharbi",
      authorisedPerson: "Bejadbn1122",
      holder: "Nab’ al-Khayrat For Trading",

      // Support MULTIPLE ACCOUNTS. Add more objects to this array when needed.
      accounts: [
        {
          accountNo: "91550872",
          status: "active",
          currency: "USD",
          balance: 0,
          lines: [
            // Example transactions (keep empty if you want “No transactions yet.”)
            // { ts: "2025-11-02T09:00:00Z", type: "credit", amount: 250000, description: "Initial funding", currency: "USD" },
            // { ts: "2025-11-02T14:00:00Z", type: "debit",  amount: 1500,   description: "Compliance fee",  currency: "USD" }
          ]
        }
        // , { ...second USD/EUR account here... }
      ]
    }

    // --- To add another client:
    // ,"new.client@email.com": {
    //   password: "Strong#Pass2025!",
    //   name: "Client Name",
    //   authorisedPerson: "clientusername",
    //   holder: "Company / Account Holder Ltd",
    //   accounts: [
    //     { accountNo: "12345678", status: "active", currency: "USD", balance: 0, lines: [] },
    //     { accountNo: "87654321", status: "active", currency: "EUR", balance: 0, lines: [] }
    //   ]
    // }
  }
};
