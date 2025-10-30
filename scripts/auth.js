<script>
  // Client login
  document.querySelector('#client-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#client-email').value.trim();
    const password = document.querySelector('#client-password').value;
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('jwt', data.token);
      location.href = '/client-dashboard.html';
    } catch (err) { showError(err.message); }
  });

  // Admin login
  document.querySelector('#admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#admin-email').value.trim();
    const password = document.querySelector('#admin-password').value;
    try {
      const data = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('jwt', data.token);
      location.href = '/admin-dashboard.html';
    } catch (err) { showError(err.message); }
  });

  // Request password reset
  document.querySelector('#request-reset-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#reset-email').value.trim();
    try {
      await apiFetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      alert('If the email exists, a reset link will be sent.');
    } catch (err) { showError(err.message); }
  });

  // Perform password reset
  document.querySelector('#do-reset-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.querySelector('#reset-token').value.trim();
    const newPassword = document.querySelector('#new-password').value;
    try {
      await apiFetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      alert('Password reset successful. Please log in.');
      location.href = '/client-login.html';
    } catch (err) { showError(err.message); }
  });
</script>
