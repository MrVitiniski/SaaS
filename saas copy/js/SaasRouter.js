document.addEventListener('DOMContentLoaded', async () => {
  const tenantSlug = Auth.getTenantSlug();

  if (!tenantSlug) {
    return;
  }

  try {
    const dados = await Auth.loadTenantContext(tenantSlug);
    const paginaAtual = window.location.pathname.split('/').pop();

    if (dados.segmento === 'Beleza' && paginaAtual !== 'agendamento.html') {
      window.location.href = Auth.buildPageUrl('agendamento.html', tenantSlug);
    } else if (dados.segmento === 'Alimentação' && paginaAtual !== 'marmitas.html') {
      window.location.href = Auth.buildPageUrl('marmitas.html', tenantSlug);
    }
  } catch (erro) {
    console.error('Erro no roteamento do SaaS:', erro);
  }
});
