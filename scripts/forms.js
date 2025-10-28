// Contact form -> backend (emails to hello@malteseFirst.com)
async function handleContactSubmit(e){
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const btn = form.querySelector('button[type="submit"]');
  const txt = btn.textContent;
  btn.disabled = true; btn.textContent = 'Sending…';

  try{
    const res = await fetch('/api/public/contact', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data),
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    alert('Thanks — we’ll reply within one business day.');
  }catch(err){
    console.error(err);
    alert('Could not send message. Please email hello@maltesefirst.com directly.');
  }finally{
    btn.disabled = false; btn.textContent = txt;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const contact = document.querySelector('#contact-form');
  if(contact) contact.addEventListener('submit', handleContactSubmit);
});
