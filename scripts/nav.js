<script>
(function(){
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('/').pop().toLowerCase();
    if((!href && path==='index.html') || href===path){ a.classList.add('active'); }
  });

  // Optional: allow ?api= override for forms.js
  const ap = new URLSearchParams(location.search).get('api');
  if(ap) sessionStorage.setItem('MFC_API', ap);
})();
</script>
