document.addEventListener('DOMContentLoaded', async () => {
  const feedback = document.getElementById('login-feedback');
  const formLogin = document.getElementById('form-login');
  const submitButton = document.getElementById('btn-submit-login');
  const tenantLabel = document.getElementById('nome-estabelecimento');
  const linkRegistrar = document.getElementById('link-registrar');
  const tenantSlug = Auth.getTenantSlug();

  if (!tenantSlug) {
    Auth.setFeedback(feedback, 'error', 'Escolha um estabelecimento antes de acessar a área do cliente.');
    formLogin?.setAttribute('hidden', 'hidden');
    tenantLabel.textContent = 'Estabelecimento não informado';
    return;
  }

  linkRegistrar.href = Auth.buildPageUrl('registrar_cliente.html', tenantSlug);

  try {
    const tenant = await Auth.loadTenantContext(tenantSlug);
    tenantLabel.textContent = tenant.empresa;
  } catch (error) {
    tenantLabel.textContent = 'Estabelecimento inválido';
    Auth.setFeedback(feedback, 'error', error.message);
    formLogin?.setAttribute('hidden', 'hidden');
    return;
  }

  formLogin?.addEventListener('submit', async (event) => {
    event.preventDefault();
    Auth.clearFeedback(feedback);

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!Auth.validateEmail(email)) {
      Auth.setFeedback(feedback, 'error', 'Informe um e-mail válido.');
      return;
    }

    if (senha.trim().length < 6) {
      Auth.setFeedback(feedback, 'error', 'Informe uma senha com pelo menos 6 caracteres.');
      return;
    }

    submitButton.disabled = true;

    try {
      const tenant = await Auth.loadTenantContext(tenantSlug);
      const resultado = await Auth.fetchJson('api/login_cliente.php', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senha,
          tenant_id: tenant.tenant_id
        })
      });

      Auth.setFeedback(feedback, 'success', resultado.mensagem || 'Login realizado com sucesso.');
      window.location.href = Auth.buildPageUrl('painel_cliente.html', tenantSlug);
    } catch (error) {
      Auth.setFeedback(feedback, 'error', error.message || 'Não foi possível conectar ao servidor.');
    } finally {
      submitButton.disabled = false;
    }
  });
});
