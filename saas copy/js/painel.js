document.addEventListener('DOMContentLoaded', async () => {
  const tenantSlug = Auth.getTenantSlug();
  const feedback = document.getElementById('painel-feedback');
  const greeting = document.getElementById('cliente-boas-vindas');
  const futureList = document.getElementById('lista-futuros');
  const pastList = document.getElementById('lista-passados');
  const futureCount = document.getElementById('resumo-futuros');
  const pastCount = document.getElementById('resumo-passados');
  const cancellableCount = document.getElementById('resumo-cancelaveis');
  const newBookingLink = document.getElementById('btn-novo-agendamento');
  const logoutButton = document.getElementById('btn-logout');

  if (!tenantSlug) {
    window.location.href = 'index.html';
    return;
  }

  newBookingLink.href = Auth.buildPageUrl('agendamento.html', tenantSlug);

  const toTimestamp = (appointment) => new Date(`${appointment.data_agendamento}T${appointment.hora_agendamento}`).getTime();
  const currency = (value) => Number.parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderEmptyState = (element, message) => {
    element.innerHTML = `<p class="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-5 text-sm text-slate-400">${message}</p>`;
  };

  const renderAppointments = (element, appointments, allowActions) => {
    if (!appointments.length) {
      renderEmptyState(element, allowActions ? 'Nenhum próximo agendamento encontrado.' : 'Nenhum agendamento concluído ou passado até o momento.');
      return;
    }

    element.innerHTML = appointments.map((appointment) => {
      const date = new Date(`${appointment.data_agendamento}T${appointment.hora_agendamento}`);
      const value = Number.parseFloat(appointment.servico_preco || 0) + Number.parseFloat(appointment.produto_preco || 0);
      const canCancel = allowActions && ['pendente', 'confirmado'].includes(String(appointment.status || '').toLowerCase());
      const statusMap = {
        pendente: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
        confirmado: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
        cancelado: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
        concluido: 'bg-slate-500/15 text-slate-200 border-slate-500/30'
      };
      const badgeClass = statusMap[appointment.status] || statusMap.pendente;
      const productInfo = appointment.produto_nome ? `${appointment.produto_nome} (${currency(appointment.produto_preco)})` : 'Nenhum item adicional';

      return `
        <article class="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">${appointment.servico_nome}</h3>
                <span class="rounded-full border px-3 py-1 text-xs font-medium ${badgeClass}">${appointment.status}</span>
              </div>
              <p class="text-sm text-slate-300">${date.toLocaleDateString('pt-BR')} às ${String(appointment.hora_agendamento).slice(0, 5)}</p>
              <p class="text-sm text-slate-400">Opcional: ${productInfo}</p>
              <p class="text-sm text-slate-400">Valor total: <strong class="text-slate-100">${currency(value)}</strong></p>
            </div>
            <div class="flex flex-wrap gap-2 lg:justify-end">
              ${canCancel ? `<button type="button" data-cancel-id="${appointment.id}" class="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20">Cancelar</button>` : ''}
              ${allowActions ? `<a href="${Auth.buildPageUrl('agendamento.html', tenantSlug)}" class="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/20">Reagendar</a>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  };

  const carregarPainelCliente = async () => {
    try {
      const sessao = await Auth.checkSession();
      if (!sessao.logado || sessao.tipo !== 'cliente') {
        window.location.href = Auth.buildPageUrl('login.html', tenantSlug);
        return;
      }

      greeting.textContent = `Olá, ${sessao.cliente.nome}!`;

      const dados = await Auth.fetchJson(`api/buscar_agendamentos_cliente.php?tenant=${encodeURIComponent(tenantSlug)}`, { headers: {} });
      const now = Date.now();
      const agendamentos = Array.isArray(dados.agendamentos) ? dados.agendamentos : [];
      const futuros = agendamentos.filter((appointment) => toTimestamp(appointment) >= now);
      const passados = agendamentos.filter((appointment) => toTimestamp(appointment) < now);
      const cancelaveis = futuros.filter((appointment) => ['pendente', 'confirmado'].includes(String(appointment.status || '').toLowerCase()));

      futureCount.textContent = String(futuros.length);
      pastCount.textContent = String(passados.length);
      cancellableCount.textContent = String(cancelaveis.length);

      renderAppointments(futureList, futuros, true);
      renderAppointments(pastList, passados, false);
    } catch (error) {
      Auth.setFeedback(feedback, 'error', error.message || 'Erro ao carregar o painel do cliente.');
      renderEmptyState(futureList, 'Não foi possível carregar seus próximos agendamentos.');
      renderEmptyState(pastList, 'Não foi possível carregar seu histórico.');
    }
  };

  futureList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-cancel-id]');
    if (!button) return;

    const agendamentoId = Number.parseInt(button.getAttribute('data-cancel-id'), 10);
    if (!agendamentoId || !window.confirm('Deseja realmente cancelar este agendamento?')) {
      return;
    }

    button.disabled = true;

    try {
      const resultado = await Auth.fetchJson('api/deletar_agendamento.php', {
        method: 'POST',
        body: JSON.stringify({ agendamento_id: agendamentoId })
      });
      Auth.setFeedback(feedback, 'success', resultado.mensagem || 'Agendamento cancelado com sucesso.');
      await carregarPainelCliente();
    } catch (error) {
      Auth.setFeedback(feedback, 'error', error.message || 'Não foi possível cancelar o agendamento.');
    } finally {
      button.disabled = false;
    }
  });

  logoutButton.addEventListener('click', async () => {
    try {
      await Auth.fetchJson('api/logout.php', { headers: {} });
      window.location.href = Auth.buildPageUrl('login.html', tenantSlug);
    } catch (error) {
      Auth.setFeedback(feedback, 'error', error.message || 'Não foi possível encerrar a sessão.');
    }
  });

  await carregarPainelCliente();
});
