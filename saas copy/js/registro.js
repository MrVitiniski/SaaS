// js/registro.js

document.addEventListener('DOMContentLoaded', () => {
  let tenantIdAtual = null;

  // 1. TRAVA DE SEGURANÇA: Captura o tenant estritamente da URL
  const obterTenantDaUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant'); // Sem fallback fixo
  };

  const tenantSlug = obterTenantDaUrl();

  // Se não houver tenant informado na URL, bloqueia e redireciona
  if (!tenantSlug) {
    alert("Erro: Nenhum estabelecimento foi informado na URL.");
    window.location.href = "index.html"; // Redireciona para a landing page central
    return;
  }

  // 2. BUSCA O CONTEXTO DO ESTABELECIMENTO
  const inicializarRegistroContextual = async () => {
    try {
      const resposta = await fetch(`http://localhost:8080/saas/api/buscar_servicos.php?tenant=${tenantSlug}`);
      const dados = await resposta.json();

      if (!dados.erro && dados.tenant_id) {
        tenantIdAtual = dados.tenant_id;
        const txtTitulo = document.getElementById('nome-estabelecimento-registro');
        if (txtTitulo) txtTitulo.textContent = dados.empresa;
      } else {
        alert("Estabelecimento inválido ou não cadastrado.");
        window.location.href = "index.html";
      }
    } catch (erro) {
      console.error("Erro ao carregar contexto do tenant:", erro);
    }
  };

  // 3. ENVIO DO FORMULÁRIO DE CADASTRO
  const formRegistro = document.getElementById('form-registro');
  if (formRegistro) {
    formRegistro.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!tenantIdAtual) {
        alert("Erro: Estabelecimento inválido ou não carregado.");
        return;
      }

      const senha = document.getElementById('registro-senha').value;
      const confirmarSenha = document.getElementById('registro-confirmar-senha').value;

      if (senha !== confirmarSenha) {
        alert("As senhas informadas não coincidem.");
        return;
      }

      const dadosCadastro = {
        tenant_id: tenantIdAtual,
        nome: document.getElementById('registro-nome').value,
        email: document.getElementById('registro-email').value,
        telefone: document.getElementById('registro-telefone').value,
        senha: senha
      };

      try {
        const resposta = await fetch('http://localhost:8080/saas/api/registrar_cliente.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosCadastro)
        });

        const resultado = await resposta.json();

        if (resultado.erro) {
          alert(resultado.erro);
        } else if (resultado.sucesso) {
          alert(resultado.mensagem);
          window.location.href = `login.html?tenant=${tenantSlug}`;
        }

      } catch (erro) {
        console.error("Erro ao realizar o cadastro:", erro);
        alert("Não foi possível conectar ao servidor.");
      }
    });
  }

  inicializarRegistroContextual();
});
