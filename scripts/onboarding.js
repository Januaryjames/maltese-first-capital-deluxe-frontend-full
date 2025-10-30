<script>
  // Onboarding submit (account-open)
  const onboardingForm = document.querySelector('#onboarding-form');
  onboardingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(onboardingForm);

    // Pull Turnstile response (auto-injected hidden input name='cf-turnstile-response')
    const turnstileInput = onboardingForm.querySelector('input[name="cf-turnstile-response"]');
    if (!turnstileInput || !turnstileInput.value) {
      showError('Please complete the CAPTCHA.');
      return;
    }

    try {
      const data = await apiFetch('/api/onboarding/submit', {
        method: 'POST',
        body: fd // browser sets multipart boundary
      });
      alert(`Application received. ID: ${data.applicationId}`);
      onboardingForm.reset();
      if (window.turnstile) window.turnstile.reset(); // reset widget
    } catch (err) { showError(err.message); }
  });
</script>
