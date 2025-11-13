/* /scripts/mock-store.js — static, file-based “DB” for client pages.
   Add more USERS/ACCOUNTS entries to support more clients. */

window.MFC_MOCK = {
  USERS: {
    // Email keys must be lower-case:

    // — Client 1: Ibrahim —
    "k.s.a1981@hotmail.com": {
      password: "MFC#Bejad2025!",
      name: "Ibrahim Bin Ali Mohammad Ghunaymi",
      companyName: "Binyan Wijdan Lilmuqawalat Establishment"
    },

    // — Client 2: Al-Matsader Al-Fadhi Co / Abdulaziz —
    "almatsaderalfadhi@gmail.com": {
      password: "MFC#Bejad2025!",
      name: "Abdulaziz Abdullah S Alzughaibi",
      companyName: "Al-Matsader Al-Fadhi Co"
    }
  },

  ACCOUNTS: {
    // — Ibrahim Bin Ali Mohammad Ghunaymi —
    "k.s.a1981@hotmail.com": {
      holder: "Binyan Wijdan Lilmuqawalat Establishment",
      accountNo: "91550874",
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
