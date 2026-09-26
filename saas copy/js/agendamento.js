document.addEventListener('DOMContentLoaded', () => {
  let tenantIdAtual = null;
  let idClienteLogado = null;

  const tenantSlug = Auth.getTenantSlug();

  if (!tenantSlug) {
    alert('Erro: Nenhum estabelecimento foi informado na URL.');
    window.location.href = 'index.html';
    return;
  }

  const preencherDadosSeLogado = async () => {
    try {
      const statusSessao = await Auth.checkSession();

      if (statusSessao.logado && statusSessao.tipo === 'cliente' && statusSessao.cliente) {
        idClienteLogado = parseInt(statusSessao.cliente.id, 10);

        const inputNome = document.getElementById('cliente-nome');
        const inputTelefone = document.getElementById('cliente-telefone');
        const inputEmail = document.getElementById('cliente-email');

        if (inputNome && statusSessao.cliente.nome) {
          inputNome.value = statusSessao.cliente.nome;
          inputNome.setAttribute('readonly', true);
          inputNome.style.backgroundColor = '#f3f4f6';
        }

        if (inputTelefone && statusSessao.cliente.telefone) {
          inputTelefone.value = statusSessao.cliente.telefone;
          inputTelefone.setAttribute('readonly', true);
          inputTelefone.style.backgroundColor = '#f3f4f6';
        }

        if (inputEmail && statusSessao.cliente.email) {
          inputEmail.value = statusSessao.cliente.email;
          inputEmail.setAttribute('readonly', true);
          inputEmail.style.backgroundColor = '#f3f4f6';
        }
      }
    } catch (erro) {
      console.error('Erro ao verificar sessão do cliente:', erro);
    }
  };

  const carregarDadosDoEstabelecimento = async () => {
    const headerTitulo = document.getElementById('tenant-name');
    const selectServico = document.getElementById('select-servico');
    const selectProduto = document.getElementById('select-produto');
    const blocoProdutos = document.getElementById('bloco-produtos');

    try {
      const dados = await Auth.fetchJson(`api/buscar_servicos.php?tenant=${encodeURIComponent(tenantSlug)}`, { headers: {} });

      tenantIdAtual = dados.tenant_id;
      headerTitulo.textContent = dados.empresa;

      const apenasServicos = dados.servicos.filter(item => item.tipo !== 'produto');
      const apenasProdutos = dados.servicos.filter(item => item.tipo === 'produto');

      selectServico.innerHTML = '<option value="">Selecione um serviço...</option>';
      apenasServicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.setAttribute('data-tipo', servico.tipo || 'geral');
        const precoFormatado = parseFloat(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        option.textContent = `${servico.nome} (${servico.duracao_minutos} min) - ${precoFormatado}`;
        selectServico.appendChild(option);
      });

      if (blocoProdutos && selectProduto) {
        if (apenasProdutos.length > 0) {
          blocoProdutos.classList.remove('hidden');
          selectProduto.innerHTML = '<option value="">Deseja levar algum item junto?</option>';
          apenasProdutos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;
            const precoFormatado = parseFloat(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            option.textContent = `${produto.nome} - ${precoFormatado}`;
            selectProduto.appendChild(option);
          });
        } else {
          blocoProdutos.classList.add('hidden');
          selectProduto.innerHTML = '<option value="">Nenhum produto disponível</option>';
        }
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      headerTitulo.textContent = 'Erro de conexão';
      selectServico.innerHTML = '<option value="">Não foi possível carregar os serviços.</option>';
    }
  };

  const form = document.getElementById('form-agendamento');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!tenantIdAtual) {
        alert('Erro: O estabelecimento não foi carregado corretamente.');
        return;
      }

      const selectServicoElement = document.getElementById('select-servico');
      const selectServicoValue = selectServicoElement.value;
      const selectProdutoElement = document.getElementById('select-produto');
      const selectProdutoValue = selectProdutoElement ? selectProdutoElement.value : null;

      if (!selectServicoValue) {
        alert('Por favor, selecione ao menos um serviço para agendar.');
        return;
      }

      const opcaoSelecionada = selectServicoElement.options[selectServicoElement.selectedIndex];
      const tipoNegocio = opcaoSelecionada ? opcaoSelecionada.getAttribute('data-tipo') : 'geral';

      const dadosFormulario = {
        tenant_id: tenantIdAtual,
        servico_id: parseInt(selectServicoValue, 10),
        produto_id: (selectProdutoValue && parseInt(selectProdutoValue, 10) > 0) ? parseInt(selectProdutoValue, 10) : null,
        cliente_id: (idClienteLogado && idClienteLogado > 0) ? idClienteLogado : null,
        data_agendamento: document.getElementById('input-data').value,
        hora_agendamento: document.getElementById('input-hora').value,
        cliente_nome: document.getElementById('cliente-nome').value.trim(),
        cliente_telefone: document.getElementById('cliente-telefone').value.trim(),
        cliente_email: document.getElementById('cliente-email').value.trim() || null,
        tipo: tipoNegocio
      };

      try {
        const resultado = await Auth.fetchJson('api/salvar_agendamento.php', {
          method: 'POST',
          body: JSON.stringify(dadosFormulario)
        });

        alert(resultado.mensagem);
        form.reset();
        idClienteLogado = null;
        carregarDadosDoEstabelecimento();
        preencherDadosSeLogado();
      } catch (erro) {
        console.error('Erro ao enviar:', erro);
        alert(erro.message || 'Não foi possível conectar com o servidor para realizar o agendamento.');
      }
    });
  }

  carregarDadosDoEstabelecimento();
  preencherDadosSeLogado();
});
