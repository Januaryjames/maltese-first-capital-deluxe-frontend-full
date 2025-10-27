// Mobile menu toggle + legacy cleanup
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  // Remove stray <a> or <br> nodes that some legacy pages render above header
  const header = document.querySelector('.site-header');
  if (header) {
    const toRemove = [];
    for (const node of document.body.childNodes) {
      if (node === header) break;
      if (node.nodeType === 1 && (node.tagName === 'A' || node.tagName === 'BR')) toRemove.push(node);
      if (node.nodeType === 3 && !node.textContent.trim()) toRemove.push(node);
    }
    toRemove.forEach(n => n.remove());
  }

  // Contact form -> open mailto with prefilled body
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.querySelector('[name="name"]').value.trim();
      const email = contactForm.querySelector('[name="email"]').value.trim();
      const phone = contactForm.querySelector('[name="phone"]').value.trim();
      const message = contactForm.querySelector('[name="message"]').value.trim();
      const subject = encodeURIComponent(`Website enquiry from ${name || 'Prospect'}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
      );
      window.location.href = `mailto:hello@maltesefirst.com?subject=${subject}&body=${body}`;
    });
  }
});
