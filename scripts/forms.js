<script>
(function(){
  const API_FALLBACK = "https://maltese-first-capital-deluxe-backend.onrender.com";
  const API = sessionStorage.getItem('MFC_API') || API_FALLBACK;

  function byId(id){ return document.getElementById(id); }
  function toast(node, msg, ok){
    node.innerHTML = `<div class="alert ${ok?'ok':'err'}">${msg}</div>`;
    node.style.display='block';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = byId('accountOpenForm');
    if(!form) return;

    const statusBox = byId('accountOpenStatus');
    const btn = byId('accountOpenBtn');

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      statusBox.style.display='none'; statusBox.innerHTML='';
      btn.disabled=true; btn.textContent='Submitting…';

      try{
        const fd = new FormData(form);
        // sanity fields
        if(!fd.get('companyName') || !fd.get('email')){
          throw new Error('Please fill the required fields.');
        }

        const res = await fetch(`${API}/api/public/account-open`, {
          method:'POST',
          body: fd,
        });

        if(!res.ok){
          const text = await res.text().catch(()=> '');
          throw new Error(text || `Request failed (${res.status})`);
        }

        const json = await res.json().catch(()=> ({}));
        const ref = json.reference || json.clientReference || json.ref || 'submitted';
        toast(statusBox, `✅ Application received. Reference: ${ref}`, true);
        form.reset();
      }catch(err){
        console.error(err);
        toast(statusBox, `❌ ${err.message || 'Submission failed.'}`, false);
      }finally{
        btn.disabled=false; btn.textContent='Submit Application';
      }
    });
  });
})();
</script>
