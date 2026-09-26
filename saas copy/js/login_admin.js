document.addEventListener('DOMContentLoaded', () => {
  const feedback = document.getElementById('admin-feedback');
  const form = document.getElementById('form-login-admin');
  const submitButton = document.getElementById('btn-submit-admin');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    Auth.clearFeedback(feedback);

    const email = document.getElementById('admin-email').value.trim();
    const senha = document.getElementById('admin-senha').value;

    if (!Auth.validateEmail(email)) {
      Auth.setFeedback(feedback, 'error', 'Informe um e-mail administrativo válido.');
      return;
    }

    if (senha.trim().length < 6) {
      Auth.setFeedback(feedback, 'error', 'Informe a senha administrativa com pelo menos 6 caracteres.');
      return;
    }

    submitButton.disabled = true;

    try {
      const resultado = await Auth.fetchJson('api/login_admin.php', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });

      Auth.setFeedback(feedback, 'success', resultado.mensagem || 'Autenticação realizada com sucesso.');
      window.location.href = 'admin_dashboard.html';
    } catch (error) {
      Auth.setFeedback(feedback, 'error', error.message || 'Não foi possível conectar ao servidor administrativo.');
    } finally {
      submitButton.disabled = false;
    }
  });
});
