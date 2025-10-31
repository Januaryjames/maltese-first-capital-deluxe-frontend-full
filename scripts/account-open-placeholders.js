// scripts/account-open-placeholders.js
// Sets safe, obviously-fake placeholders on the account-open form.
// No layout/CSS changes. Safe to leave deployed.

(() => {
  const trySet = (selectors, value) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && 'placeholder' in el && !el.placeholder) {
        el.placeholder = value;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Text fields
    trySet(['#fullName','[name="fullName"]','input[name="name"]'], 'Example Applicant');
    trySet(['#email','[name="email"]'], 'applicant@example.com'); // RFC reserved domain
    trySet(['#phone','[name="phone"]'], '+356 0000 0000');        // clearly fake
    trySet(['#companyName','[name="companyName"]','input[name="company"]'], 'Example Holdings Ltd');
    trySet(['#country','[name="country"]'], 'Malta');             // as a hint only
    trySet(['#address1','[name="address1"]'], '99 Example Street');
    trySet(['#address2','[name="address2"]'], 'Suite 5');
    trySet(['#city','[name="city"]'], 'Capital City');
    trySet(['#postcode','[name="postcode"]','[name="zip"]'], 'AA 0000');

    // File inputs: add a tooltip (does not alter layout)
    const tip = (sel, title) => {
      const el = document.querySelector(sel);
      if (el && !el.title) el.title = title;
    };
    tip('[name="passport"]',       'Upload passport (PDF/JPG/PNG, ≤16MB)');
    tip('[name="proofOfAddress"]', 'Upload recent utility bill (PDF/JPG/PNG, ≤16MB)');
    tip('[name="companyDocs"]',    'Upload incorporation documents (PDFs, ≤16MB each)');
    tip('[name="selfie"]',         'Upload ID selfie (JPG/PNG, ≤16MB)');
  });
})();
