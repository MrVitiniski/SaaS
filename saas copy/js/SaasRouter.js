// js/SaaSRouter.js

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantSlug = urlParams.get('tenant');

  if (!tenantSlug) {
    console.error("Nenhum tenant informado na URL.");
    return;
  }

  try {
    // Pergunta para a API qual o segmento deste tenant
    const resposta = await fetch(`http://localhost:8080/saas/api/identificar_tenant.php?tenant=${tenantSlug}`);
    const dados = await resposta.json();

    if (dados.erro) {
      document.body.innerHTML = `<div style="text-align:center; padding:50px;"><h2>${dados.erro}</h2></div>`;
      return;
    }

    // Identifica o arquivo atual da URL
    const paginaAtual = window.location.pathname.split("/").pop();

    // Lógica do roteamento dinâmico:
    if (dados.segmento === 'Beleza' && paginaAtual !== 'index.html') {
      // Se for barbearia e não estiver no index, redireciona para a tela de agendamento
      window.location.href = `index.html?tenant=${tenantSlug}`;
    } else if (dados.segmento === 'Alimentação' && paginaAtual !== 'marmitas.html') {
      // Se for restaurante e não estiver na tela de marmitas, redireciona para o seu novo layout
      window.location.href = `marmitas.html?tenant=${tenantSlug}`;
    }

  } catch (erro) {
    console.error("Erro no roteamento do SaaS:", erro);
  }
});
