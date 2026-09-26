document.addEventListener('DOMContentLoaded', () => {
    const carregarDashboardAdmin = async () => {
        const tabelaCorpo = document.getElementById('tabela-admin-corpo');
        const totalPendentes = document.getElementById('total-pendentes');
        const totalConfirmados = document.getElementById('total-confirmados');
        const totalGeral = document.getElementById('total-geral');

        try {
            const dados = await Auth.fetchJson('api/buscar_agendamentos_admin.php', { headers: {} });

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

            if (totalGeral) totalGeral.textContent = dados.total_agendamentos;

            dados.agendamentos.forEach(agenda => {
                const tr = document.createElement('tr');

                if (agenda.status === 'pendente') qtdPendentes++;
                if (agenda.status === 'confirmado') qtdConfirmados++;

                const [ano, mes, dia] = agenda.data_agendamento.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;
                const horaFormatada = agenda.hora_agendamento.substring(0, 5);

                let valorTotal = parseFloat(agenda.servico_preco);
                let detalheItens = `<strong>${agenda.servico_nome}</strong>`;

                if (agenda.produto_nome) {
                    valorTotal += parseFloat(agenda.produto_preco);
                    detalheItens += `<br><span style="font-size:12px; color:#64748b;">📦 + Opcional: ${agenda.produto_nome}</span>`;
                }

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

            if (totalPendentes) totalPendentes.textContent = qtdPendentes;
            if (totalConfirmados) totalConfirmados.textContent = qtdConfirmados;

            ativarEventosDeBotoes();

        } catch (erro) {
            console.error('Erro ao carregar dados do admin:', erro);
            if (String(erro.message || '').toLowerCase().includes('sessão')) {
                window.location.href = 'login_admin.html';
                return;
            }
            tabelaCorpo.innerHTML = `<tr><td colspan="6" class="text-center" style="color: #ef4444;">Erro de conexão com o servidor.</td></tr>`;
        }
    };

    const alterarStatusAgendamento = async (id, novoStatus) => {
        try {
            const resultado = await Auth.fetchJson('api/atualizar_status_agendamento.php', {
                method: 'POST',
                body: JSON.stringify({
                    agendamento_id: id,
                    status: novoStatus
                })
            });

            if (resultado.sucesso) {
                carregarDashboardAdmin();
            }
        } catch (erro) {
            console.error('Erro ao atualizar status:', erro);
            alert(erro.message || 'Não foi possível alterar o status devido a um erro de conexão.');
        }
    };

    const ativarEventosDeBotoes = () => {
        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                alterarStatusAgendamento(id, 'confirmado');
            });
        });

        document.querySelectorAll('.btn-finish').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                alterarStatusAgendamento(id, 'concluido');
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Deseja realmente alterar o status deste agendamento para cancelado?')) {
                    const id = btn.getAttribute('data-id');
                    alterarStatusAgendamento(id, 'cancelado');
                }
            });
        });
    };

    const btnLogoutAdmin = document.getElementById('btn-logout-admin');
    if (btnLogoutAdmin) {
        btnLogoutAdmin.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await Auth.fetchJson('api/logout.php', { headers: {} });
                window.location.href = 'login_admin.html';
            } catch (erro) {
                console.error('Erro ao realizar logout:', erro);
            }
        });
    }

    carregarDashboardAdmin();
});
