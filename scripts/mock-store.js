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
      password: "Whi123456$",
      name: "Abdulaziz Abdullah S Alzughaibi",
      companyName: "Al-Matsader Al-Fadhi Co"
    },

    // — Client 3: Keem Group Ltd / Nderitú Wachira —
    "keemkenya@gmail.com": {
      password: "MFC#Keem2025!",
      name: "Nderitú Wachira",
      companyName: "Keem Group Ltd"
    }
  },

  ACCOUNTS: {
    // — Account: Ibrahim —
    "k.s.a1981@hotmail.com": {
      holder: "Binyan Wijdan Lilmuqawalat Establishment",
      accountNo: "91550874",
      currency: "USD",
      status: "active",
      balance: 0,
      lines: []
    },

    // — Account: Al-Matsader Al-Fadhi Co —
    "almatsaderalfadhi@gmail.com": {
      holder: "Al-Matsader Al-Fadhi Co",
      accountNo: "91550873",
      currency: "USD",
      status: "active",
      balance: 0, // still pending — not added to balance
      lines: [
        {
          ts: new Date().toISOString(),
          type: "credit",
          amount: 5000000,
          currency: "USD",
          description: "Loan Credit (Pending)",
          pending: true
        }
      ]
    },

    // — Account: Keem Group Ltd —
    "keemkenya@gmail.com": {
      holder: "Keem Group Ltd",
      accountNo: "91550875",      // next sequential number
      currency: "USD",
      status: "active",
      balance: 0,                 // do NOT add to balance because it is pending
      lines: [
        {
          ts: new Date().toISOString(),  // today's timestamp
          type: "credit",
          amount: 50000000,              // 50,000,000.00 USD
          currency: "USD",
          description: "Incoming Credit (Pending)",
          pending: true
        }
      ]
    }
  }
};