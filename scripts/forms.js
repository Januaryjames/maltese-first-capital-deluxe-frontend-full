document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/register', {  // Replace with your Render backend endpoint
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    alert('Registration submitted successfully. We will review your details.');
                    form.reset();
                } else {
                    alert('Submission failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please check your connection.');
            }
        });
    }
});
