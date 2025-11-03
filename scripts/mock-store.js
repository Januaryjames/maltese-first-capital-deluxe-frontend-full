/* /scripts/mock-store.js — static, file-based “DB” for client pages.
   Add more USERS/ACCOUNTS entries to support more clients. */

window.MFC_MOCK = {
  USERS: {
    // Email keys must be lower-case:

    // — Client 1: Bejad —
    "bejadbn1122@gmail.com": {
      password: "MFC#Bejad2025!",
      name: "Bejad Bandoor A. Alharbi",
      companyName: "Nab’ al-Khayrat For Trading"
    },

    // — Client 2: Al-Matsader Al-Fadhi Co / Abdulaziz —
    "almatsaderalfadhi@gmail.com": {
      password: "MFC#Bejad2025!",
      name: "Abdulaziz Abdullah Al-Husseini",
      companyName: "Al-Matsader Al-Fadhi Co"
    }
  },

  ACCOUNTS: {
    // — Bejad —
    "bejadbn1122@gmail.com": {
      holder: "Nab’ al-Khayrat For Trading",
      accountNo: "91550872",
      currency: "USD",
      status: "active",
      balance: 0,
      lines: [
        // Example:
        // { ts: "2025-10-30T12:00:00Z", type: "credit", amount: 5000000, currency: "USD", description: "Loan Credit (Pending Activation)" }
      ]
    },

    // — Al-Matsader Al-Fadhi Co —
    "almatsaderalfadhi@gmail.com": {
      holder: "Al-Matsader Al-Fadhi Co",
      accountNo: "91550873",   // sequential; adjust if you have a different scheme
      currency: "USD",
      status: "active",
      balance: 0,
      lines: []
    }
  }
};
