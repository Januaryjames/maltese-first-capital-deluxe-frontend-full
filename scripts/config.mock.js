// /scripts/config.mock.js
// Static data for mock login + dashboard (no backend).
// Flip ALLOW_ANY_PASSWORD to true for "accept any password" mode.

window.MFC_MOCK = {
  ALLOW_ANY_PASSWORD: true, // ← set false to enforce the password below

  USERS: {
    "bejadbn1122@gmail.com": {
      // Login credentials (used only if ALLOW_ANY_PASSWORD === false)
      password: "Temp#2025!",

      // Display data
      name: "Bejad Bandoor A. Alharbi",
      authorisedPerson: "Bejadbn1122",

      // Company name should be the account holder (per your requirement)
      holder: "Nab’ al-Khayrat For Trading",

      account: {
        accountNo: "91550872",
        status: "active",
        currency: "USD",
        balance: 0,
        // Add lines to show transactions (debit = negative, credit = positive)
        // { ts: '2025-11-02T11:00:00Z', type: 'credit', amount: 5000000, description: 'Initial credit' }
        lines: []
      }
    }
  },

  // Session TTL (hours). 24h keeps it “logged in” until tomorrow.
  SESSION_HOURS: 24
};
