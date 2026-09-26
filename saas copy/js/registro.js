document.addEventListener('DOMContentLoaded', async () => {
  const feedback = document.getElementById('registro-feedback');
  const formRegistro = document.getElementById('form-registro');
  const submitButton = document.getElementById('btn-submit-registro');
  const tenantLabel = document.getElementById('nome-estabelecimento-registro');
  const linkLogin = document.getElementById('link-login');
  const tenantSlug = Auth.getTenantSlug();
  let tenantIdAtual = 0;

  if (!tenantSlug) {
    Auth.setFeedback(feedback, 'error', 'Escolha um estabelecimento antes de criar sua conta.');
    formRegistro?.setAttribute('hidden', 'hidden');
    tenantLabel.textContent = 'Estabelecimento não informado';
    return;
  }

  linkLogin.href = Auth.buildPageUrl('login.html', tenantSlug);

  try {
    const tenant = await Auth.loadTenantContext(tenantSlug);
    tenantIdAtual = tenant.tenant_id;
    tenantLabel.textContent = tenant.empresa;
  } catch (error) {
    tenantLabel.textContent = 'Estabelecimento inválido';
    Auth.setFeedback(feedback, 'error', error.message);
    formRegistro?.setAttribute('hidden', 'hidden');
    return;
  }

  formRegistro?.addEventListener('submit', async (event) => {
    event.preventDefault();
    Auth.clearFeedback(feedback);

    const nome = document.getElementById('registro-nome').value.trim();
    const email = document.getElementById('registro-email').value.trim();
    const telefone = document.getElementById('registro-telefone').value.trim();
    const senha = document.getElementById('registro-senha').value;
    const confirmarSenha = document.getElementById('registro-confirmar-senha').value;

    if (nome.length < 3) {
      Auth.setFeedback(feedback, 'error', 'Informe seu nome completo.');
      return;
    }

    if (!Auth.validateEmail(email)) {
      Auth.setFeedback(feedback, 'error', 'Informe um e-mail válido.');
      return;
    }

    if (!Auth.validatePhone(telefone)) {
      Auth.setFeedback(feedback, 'error', 'Informe um telefone com DDD válido.');
      return;
    }

    if (senha.length < 6) {
      Auth.setFeedback(feedback, 'error', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      Auth.setFeedback(feedback, 'error', 'As senhas informadas não coincidem.');
      return;
    }

    submitButton.disabled = true;

    try {
      const resultado = await Auth.fetchJson('api/registrar_cliente.php', {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantIdAtual,
          nome,
          email,
          telefone,
          senha
        })
      });

      Auth.setFeedback(feedback, 'success', resultado.mensagem || 'Cadastro realizado com sucesso.');
      window.location.href = Auth.buildPageUrl('login.html', tenantSlug);
    } catch (error) {
      Auth.setFeedback(feedback, 'error', error.message || 'Não foi possível concluir o cadastro.');
    } finally {
      submitButton.disabled = false;
    }
  });
});
