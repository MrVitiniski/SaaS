// js/login.js

document.addEventListener('DOMContentLoaded', () => {
  let tenantIdAtual = null;

  // 1. TRAVA DE SEGURANÇA: Captura o tenant estritamente da URL
  const obterTenantDaUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant');
  };

  const tenantSlug = obterTenantDaUrl();

  if (!tenantSlug) {
    alert("Erro: Nenhum estabelecimento foi informado na URL.");
    window.location.href = "index.html";
    return;
  }

  // 2. BUSCA CONTEXTO DO TENANT
  const inicializarLoginContextual = async () => {
    try {
      const resposta = await fetch(`http://localhost:8080/saas/api/buscar_servicos.php?tenant=${tenantSlug}`);
      const dados = await resposta.json();

      if (!dados.erro && dados.tenant_id) {
        tenantIdAtual = dados.tenant_id;
        const txtTitulo = document.getElementById('nome-estabelecimento');
        if (txtTitulo) txtTitulo.textContent = dados.empresa;
      } else {
        alert("Estabelecimento inválido ou não cadastrado.");
        window.location.href = "index.html";
      }
    } catch (erro) {
      console.error("Erro ao carregar contexto do tenant:", erro);
    }
  };

  // 3. ENVIO DO FORMULÁRIO DE LOGIN
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!tenantIdAtual) {
        alert("Erro: Estabelecimento inválido ou não identificado.");
        return;
      }

      const dadosLogin = {
        email: document.getElementById('login-email').value,
        senha: document.getElementById('login-senha').value,
        tenant_id: tenantIdAtual
      };

      try {
        const resposta = await fetch('http://localhost:8080/saas/api/login_cliente.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosLogin)
        });

        const resultado = await resposta.json();

        if (resultado.erro) {
          alert(resultado.erro);
        } else if (resultado.sucesso) {
          alert(resultado.mensagem);
          window.location.href = `painel_cliente.html?tenant=${tenantSlug}`;
        }

      } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        alert("Não foi possível conectar ao servidor.");
      }
    });
  }

  inicializarLoginContextual();
});
