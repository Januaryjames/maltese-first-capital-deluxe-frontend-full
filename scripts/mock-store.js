/* /scripts/mock-store.js — static, file-based “DB” for client pages.
   Add more USERS/ACCOUNTS entries to support more clients. */

window.MFC_MOCK = {
  USERS: {
    // Email must be lower-case:
    "bejadbn1122@gmail.com": {
      password: "MFC#Bejad2025!",
      name: "Bejad Bandoor A. Alharbi",
      companyName: "Nab’ al-Khayrat For Trading"
    }
  },

  ACCOUNTS: {
    "bejadbn1122@gmail.com": {
      holder: "Nab’ al-Khayrat For Trading",
      accountNo: "91550872",
      currency: "USD",
      status: "active",
      balance: 0,
      lines: [
        // sample (add more if needed):
        // { ts: "2025-10-30T12:00:00Z", type: "credit", amount: 5000000, currency: "USD", description: "Loan Credit (Pending Activation)" }
      ]
    }
  }
};
