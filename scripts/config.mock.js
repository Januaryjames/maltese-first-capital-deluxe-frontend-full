// /scripts/config.mock.js
// Static multi-client registry for mock login.

window.MFC_MOCK = {
  ALLOW_ANY_PASSWORD: false,     // enforce real passwords
  SESSION_HOURS: 24,

  USERS: {
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
        lines: []
      }
    }

    // Add more clients by copying the block above and changing values.
  }
};
