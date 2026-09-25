// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. CARREGAR TODOS OS AGENDAMENTOS E ATUALIZAR CONTADORES
    const carregarDashboardAdmin = async () => {
        const tabelaCorpo = document.getElementById('tabela-admin-corpo');
        const totalPendentes = document.getElementById('total-pendentes');
        const totalConfirmados = document.getElementById('total-confirmados');
        const totalGeral = document.getElementById('total-geral');

        try {
            // Consome a API administrativa criada anteriormente
            const resposta = await fetch('http://localhost:8080/saas/api/buscar_agendamentos_admin.php');
            
            // Se o PHP retornar 401 (Não autorizado), redireciona o admin para o login
            if (resposta.status === 401) {
                alert("Sessão administrativa expirada ou inválida. Por favor, faça login.");
                window.location.href = "login_admin.html"; // Altere se o nome do arquivo de login admin for diferente
                return;
            }

            const dados = await resposta.json();

            if (dados.erro) {
                alert(dados.erro);
                return;
            }

            // Inicializa variáveis para os contadores dos cards superiores
            let qtdPendentes = 0;
            let qtdConfirmados = 0;

            tabelaCorpo.innerHTML = '';

            if (!dados.agendamentos || dados.agendamentos.length === 0) {
                tabelaCorpo.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum agendamento ou pedido registrado até o momento.</td></tr>`;
                if (totalPendentes) totalPendentes.textContent = '0';
                if (totalConfirmados) totalConfirmados.textContent = '0';
                if (totalGeral) totalGeral.textContent = '0';
                return;
            }

            // Atualiza o contador geral com base no retorno da API
            if (totalGeral) totalGeral.textContent = dados.total_agendamentos;

            // Renderiza cada linha da tabela
            dados.agendamentos.forEach(agenda => {
                const tr = document.createElement('tr');

                // Incrementa contadores baseado no status atual
                if (agenda.status === 'pendente') qtdPendentes++;
                if (agenda.status === 'confirmado') qtdConfirmados++;

                // Formata Data (AAAA-MM-DD para DD/MM/AAAA)
                const [ano, mes, dia] = agenda.data_agendamento.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;
                const horaFormatada = agenda.hora_agendamento.substring(0, 5);

                // Calcula o Valor Total do faturamento (Serviço + Produto Opcional se houver)
                let valorTotal = parseFloat(agenda.servico_preco);
                let detalheItens = `<strong>${agenda.servico_nome}</strong>`;

                if (agenda.produto_nome) {
                    valorTotal += parseFloat(agenda.produto_preco);
                    detalheItens += `<br><span style="font-size:12px; color:#64748b;">📦 + Opcional: ${agenda.produto_nome}</span>`;
                }

                // Bloco de Botões Dinâmicos de Acordo com o Status
                let botoesAcao = '';
                if (agenda.status === 'pendente') {
                    botoesAcao = `
                        <button class="btn-action btn-confirm" data-id="${agenda.id}">Aceitar</button>
                        <button class="btn-action btn-cancel" data-id="${agenda.id}">Recusar</button>
                    `;
                } else if (agenda.status === 'confirmado') {
                    botoesAcao = `
                        <button class="btn-action btn-finish" data-id="${agenda.id}">Concluir</button>
                        <button class="btn-action btn-cancel" data-id="${agenda.id}">Cancelar</button>
                    `;
                } else {
                    botoesAcao = `<span style="font-size: 13px; color: #94a3b8; font-style: italic;">Sem ações pendentes</span>`;
                }

                tr.innerHTML = `
                    <td><strong>${dataFormatada}</strong><br><span style="color:#64748b;"> às ${horaFormatada}</span></td>
                    <td>
                        <strong>${agenda.cliente_nome}</strong><br>
                        <span style="font-size:13px; color:#475569;">📞 ${agenda.cliente_telefone}</span>
                    </td>
                    <td>${detalheItens}</td>
                    <td><strong>R$ ${valorTotal.toFixed(2).replace('.', ',')}</strong></td>
                    <td><span class="badge badge-${agenda.status}">${agenda.status.toUpperCase()}</span></td>
                    <td><div class="btn-group">${botoesAcao}</div></td>
                `;

                tabelaCorpo.appendChild(tr);
            });

            // Atualiza os elementos visuais dos cards com a contagem calculada
            if (totalPendentes) totalPendentes.textContent = qtdPendentes;
            if (totalConfirmados) totalConfirmados.textContent = qtdConfirmados;

            // Vincula o clique de alteração de status nos novos botões injetados
            ativarEventosDeBotoes();

        } catch (erro) {
            console.error('Erro ao carregar dados do admin:', erro);
            tabelaCorpo.innerHTML = `<tr><td colspan="6" class="text-center" style="color: #ef4444;">Erro de conexão com o servidor.</td></tr>`;
        }
    };

    // 2. ATIVAR OS CLIQUES E ENVIAR AS ATUALIZAÇÕES PARA A API DO MYSQL
    const alterarStatusAgendamento = async (id, novoStatus) => {
        try {
            const resposta = await fetch('http://localhost:8080/saas/api/atualizar_status_agendamento.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agendamento_id: id,
                    status: novoStatus
                })
            });

            const resultado = await resposta.json();

            if (resultado.erro) {
                alert(resultado.erro);
            } else if (resultado.sucesso) {
                // Atualiza a listagem inteira na tela de forma assíncrona trazendo os novos status e contadores
                carregarDashboardAdmin();
            }
        } catch (erro) {
            console.error('Erro ao atualizar status:', erro);
            alert('Não foi possível alterar o status devido a um erro de conexão.');
        }
    };

    const ativarEventosDeBotoes = () => {
        // Captura cliques no botão "Aceitar"
        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                alterarStatusAgendamento(id, 'confirmado');
            });
        });

        // Captura cliques no botão "Concluir"
        document.querySelectorAll('.btn-finish').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                alterarStatusAgendamento(id, 'concluido');
            });
        });

        // Captura cliques no botão "Cancelar / Recusar"
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Deseja realmente alterar o status deste agendamento para cancelado?')) {
                    const id = btn.getAttribute('data-id');
                    alterarStatusAgendamento(id, 'cancelado');
                }
            });
        });
    };

    // 3. LOGOUT DO ADMINISTRADOR
    const btnLogoutAdmin = document.getElementById('btn-logout-admin');
    if (btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Reaproveita a API de logout que limpa a sessão global do PHP
                const resposta = await fetch('http://localhost:8080/saas/api/logout_cliente.php');
                const resultado = await resposta.json();
                if (resultado.sucesso) {
                    window.location.href = "login_admin.html";
                }
            } catch (erro) {
                console.error('Erro ao realizar logout:', erro);
            }
        });
    }

    // Inicializa a busca de dados assim que o painel abrir
    carregarDashboardAdmin();
});
