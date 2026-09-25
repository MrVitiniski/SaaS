// js/painel.js

document.addEventListener('DOMContentLoaded', () => {
  const obterTenantDaUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant') || 'barbearia-premium';
  };

  const tenantSlug = obterTenantDaUrl();

  // 1. CARREGAR DADOS DO PAINEL DO CLIENTE
  const carregarPainelCliente = async () => {
    const txtBoasVindas = document.getElementById('cliente-boas-vindas');
    const tabelaCorpo = document.getElementById('tabela-agendamentos-corpo');

    try {
      const resposta = await fetch(`http://localhost:8080/saas/api/buscar_agendamentos_cliente.php?tenant=${tenantSlug}`);
      
      // Se o PHP retornar 401 (Não autorizado), redireciona imediatamente para o login
      if (resposta.status === 401) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        window.location.href = `login.html?tenant=${tenantSlug}`;
        return;
      }

      const dados = await resposta.json();

      if (dados.erro) {
        alert(dados.erro);
        return;
      }

      // Define o nome do cliente na saudação
      txtBoasVindas.textContent = `Olá, ${dados.cliente_nome}!`;

      // Renderiza a lista de agendamentos
      tabelaCorpo.innerHTML = '';

      if (dados.agendamentos.length === 0) {
        tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Você ainda não possui agendamentos marcados.</td></tr>`;
        return;
      }

      dados.agendamentos.forEach(agendamento => {
        const tr = document.createElement('tr');

        // Formata Data (AAAA-MM-DD para DD/MM/AAAA)
        const [ano, mes, dia] = agendamento.data_agendamento.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        // Calcula o Valor Total (Serviço + Produto Opcional se houver)
        let valorTotal = parseFloat(agendamento.servico_preco);
        let detalheProduto = '<em>Nenhum</em>';

        if (agendamento.produto_nome) {
          valorTotal += parseFloat(agendamento.produto_preco);
          detalheProduto = `${agendamento.produto_nome} (+ R$ ${parseFloat(agendamento.produto_preco).toFixed(2)})`;
        }

        // Define a cor da badge de status
        let statusBadge = `<span style="padding: 2px 8px; border-radius: 4px; background: #ffeeba; color: #856404;">${agendamento.status}</span>`;
        if (agendamento.status === 'confirmado') {
          statusBadge = `<span style="padding: 2px 8px; border-radius: 4px; background: #d4edda; color: #155724;">Confirmado</span>`;
        }

        tr.innerHTML = `
          <td style="padding:10px; border-bottom:1px solid #ddd;">${dataFormatada} às ${agendamento.hora_agendamento.substring(0, 5)}</td>
          <td style="padding:10px; border-bottom:1px solid #ddd;"><strong>${agendamento.servico_nome}</strong></td>
          <td style="padding:10px; border-bottom:1px solid #ddd; font-size:14px; color:#555;">${detalheProduto}</td>
          <td style="padding:10px; border-bottom:1px solid #ddd;">R$ ${valorTotal.toFixed(2)}</td>
          <td style="padding:10px; border-bottom:1px solid #ddd;">${statusBadge}</td>
        `;
        tabelaCorpo.appendChild(tr);
      });

    } catch (erro) {
      console.error('Erro ao carregar o painel:', erro);
      alert('Erro de conexão ao carregar seus dados.');
    }
  };

  // 2. LÓGICA DE LOGOUT
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const resposta = await fetch('http://localhost:8080/saas/api/logout_cliente.php');
        const resultado = await resposta.json();
        if (resultado.sucesso) {
          window.location.href = `login.html?tenant=${tenantSlug}`;
        }
      } catch (erro) {
        console.error('Erro ao sair:', erro);
      }
    });
  }

  // Inicializa o painel
  carregarPainelCliente();
});
