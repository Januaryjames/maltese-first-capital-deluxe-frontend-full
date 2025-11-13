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
        // no transactions yet
      ]
    },

    // — Al-Matsader Al-Fadhi Co / Abdulaziz —
    "almatsaderalfadhi@gmail.com": {
      holder: "Al-Matsader Al-Fadhi Co",
      accountNo: "91550873",   // sequential; adjust if needed
      currency: "USD",
      status: "active",
      // keep balance at 0 because this is still pending
      balance: 0,
      lines: [
        {
          ts: new Date().toISOString(),      // today’s date/time at load
          type: "credit",
          amount: 5000000,                   // 5,000,000.00 USD
          currency: "USD",
          description: "Loan Credit (Pending)",
          pending: true                      // flag so UI can style it as pending
        }
      ]
    }
  }
};
