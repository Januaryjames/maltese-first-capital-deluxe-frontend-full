/* Invisible Turnstile with zero visual impact */
(function(){
  const me = document.currentScript;
  const SITE_KEY = me?.dataset?.sitekey || '';
  const targets = (me?.dataset?.targets || '#onboarding-form,#contact-form').split(',');

  function ready(cb){ if(window.turnstile) cb(); else setTimeout(()=>ready(cb), 30); }

  function bind(form){
    if(!form || form.dataset.tsBound) return;
    form.dataset.tsBound = '1';

    let hidden = form.querySelector('input[name="cf_turnstile_response"]');
    if(!hidden){ hidden = document.createElement('input'); hidden.type='hidden'; hidden.name='cf_turnstile_response'; form.appendChild(hidden); }

    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    form.appendChild(holder);

    ready(function(){
      const wid = window.turnstile.render(holder, {
        sitekey: SITE_KEY,
        size: 'invisible',
        callback: function(token){
          hidden.value = token;
          form.dataset.tsPass = '1';
          if (form.requestSubmit) form.requestSubmit(); else HTMLFormElement.prototype.submit.call(form);
          setTimeout(()=>{ hidden.value=''; form.dataset.tsPass=''; }, 1000);
        }
      });

      form.addEventListener('submit', function(e){
        if (form.dataset.tsPass === '1' || hidden.value) return;
        e.preventDefault();
        try { window.turnstile.execute(wid); }
        catch { form.dataset.tsPass='1'; if(form.requestSubmit) form.requestSubmit(); else HTMLFormElement.prototype.submit.call(form); }
      }, true);
    });
  }

  (function load(){
    if(!SITE_KEY) return;
    if(!document.querySelector('script[src*="turnstile/v0/api.js"]')){
      const s=document.createElement('script'); s.src='https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async=true; s.defer=true; document.head.appendChild(s);
    }
    targets.map(sel=>sel && sel.trim()).filter(Boolean).map(sel=>document.querySelector(sel)).filter(Boolean).forEach(bind);
  })();
})();
