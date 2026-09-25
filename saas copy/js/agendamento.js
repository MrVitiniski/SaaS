// js/agendamento.js

document.addEventListener('DOMContentLoaded', () => {
  // Variáveis globais de controle do escopo e sessão
  let tenantIdAtual = null; 
  let idClienteLogado = null; // Armazena o ID real do cliente se ele estiver logado

  const obterTenantDaUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant'); // Removido fallback fixo por segurança
  };

  const tenantSlug = obterTenantDaUrl();

  // Se tentar acessar o index de agendamentos sem informar o ?tenant=, barra o carregamento
  if (!tenantSlug) {
    alert("Erro: Nenhum estabelecimento foi informado na URL.");
    window.location.href = "index.html"; 
    return;
  }

  // 1. VERIFICAR SESSÃO AND AUTO-PREENCHER OS DADOS DO CLIENTE
  const preencherDadosSeLogado = async () => {
    try {
      const resposta = await fetch('http://localhost:8080/saas/api/checar_sessao.php');
      const statusSessao = await resposta.json();

      if (statusSessao.logado && statusSessao.cliente) {
        // Guarda o ID numérico real do cliente para o momento do agendamento
        idClienteLogado = parseInt(statusSessao.cliente.id);

        const inputNome = document.getElementById('cliente-nome');
        const inputTelefone = document.getElementById('cliente-telefone');
        const inputEmail = document.getElementById('cliente-email');

        // Preenche o campo Nome e bloqueia para edição
        if (inputNome && statusSessao.cliente.nome) {
          inputNome.value = statusSessao.cliente.nome;
          inputNome.setAttribute('readonly', true);
          inputNome.style.backgroundColor = '#f3f4f6'; // Estilo visual cinza de desabilitado
        }

        // Preenche o campo Telefone e bloqueia para edição
        if (inputTelefone && statusSessao.cliente.telefone) {
          inputTelefone.value = statusSessao.cliente.telefone;
          inputTelefone.setAttribute('readonly', true);
          inputTelefone.style.backgroundColor = '#f3f4f6';
        }

        // Preenche o campo E-mail e bloqueia para edição
        if (inputEmail && statusSessao.cliente.email) {
          inputEmail.value = statusSessao.cliente.email;
          inputEmail.setAttribute('readonly', true);
          inputEmail.style.backgroundColor = '#f3f4f6';
        }
      }
    } catch (erro) {
      console.error("Erro ao verificar sessão do cliente:", erro);
    }
  };

  // 2. CARREGAR SERVIÇOS E PRODUTOS DO BANCO
  const carregarDadosDoEstabelecimento = async () => {
    const headerTitulo = document.getElementById('tenant-name');
    const selectServico = document.getElementById('select-servico');
    const selectProduto = document.getElementById('select-produto');
    const blocoProdutos = document.getElementById('bloco-produtos');

    try {
      const resposta = await fetch(`http://localhost:8080/saas/api/buscar_servicos.php?tenant=${tenantSlug}`);
      const dados = await resposta.json();

      if (dados.erro) {
        headerTitulo.textContent = "Erro ao carregar";
        selectServico.innerHTML = `<option value="">${dados.erro}</option>`;
        return;
      }

      tenantIdAtual = dados.tenant_id;
      headerTitulo.textContent = dados.empresa;

      const apenasServicos = dados.servicos.filter(item => item.tipo !== 'produto');
      const apenasProdutos = dados.servicos.filter(item => item.tipo === 'produto');

      // Renderiza Serviços
      selectServico.innerHTML = '<option value="">Selecione um serviço...</option>';
      apenasServicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.setAttribute('data-tipo', servico.tipo || 'geral');
        
        const precoFormatado = parseFloat(servico.preco).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        option.textContent = `${servico.nome} (${servico.duracao_minutos} min) - ${precoFormatado}`;
        selectServico.appendChild(option);
      });

      // Renderiza Produtos Opcionais
      if (blocoProdutos && selectProduto) {
        if (apenasProdutos.length > 0) {
          blocoProdutos.classList.remove('hidden');
          selectProduto.innerHTML = '<option value="">Deseja levar algum item junto?</option>';
          
          apenasProdutos.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.id;

            const precoFormatado = parseFloat(produto.preco).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            });

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
      headerTitulo.textContent = "Erro de conexão";
      selectServico.innerHTML = '<option value="">Não foi possível carregar os serviços.</option>';
    }
  };

  // 3. ENVIAR DADOS DO FORMULÁRIO PARA O BANCO
  const form = document.getElementById('form-agendamento');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!tenantIdAtual) {
        alert("Erro: O estabelecimento não foi carregado corretamente.");
        return;
      }

      const selectServicoElement = document.getElementById('select-servico');
      const selectServicoValue = selectServicoElement.value;
      
      const selectProdutoElement = document.getElementById('select-produto');
      const selectProdutoValue = selectProdutoElement ? selectProdutoElement.value : null;

      if (!selectServicoValue) {
        alert("Por favor, selecione ao menos um serviço para agendar.");
        return;
      }

      const opcaoSelecionada = selectServicoElement.options[selectServicoElement.selectedIndex];
      const tipoNegocio = opcaoSelecionada ? opcaoSelecionada.getAttribute('data-tipo') : 'geral';

      // BLINDAGEM COMPLETA: Garante que só vai o ID se ele for um número válido e maior que zero
      const dadosFormulario = {
        tenant_id: tenantIdAtual,
        servico_id: parseInt(selectServicoValue),
        produto_id: (selectProdutoValue && parseInt(selectProdutoValue) > 0) ? parseInt(selectProdutoValue) : null,
        cliente_id: (idClienteLogado && idClienteLogado > 0) ? idClienteLogado : null, // Evita envio de strings "null" ou zeros
        data_agendamento: document.getElementById('input-data').value,
        hora_agendamento: document.getElementById('input-hora').value,
        cliente_nome: document.getElementById('cliente-nome').value.trim(),
        cliente_telefone: document.getElementById('cliente-telefone').value.trim(),
        cliente_email: document.getElementById('cliente-email').value.trim() || null,
        tipo: tipoNegocio
      };

      try {
        const respuesta = await fetch('http://localhost:8080/saas/api/salvar_agendamento.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosFormulario)
        });

        const resultado = await respuesta.json();

        if (resultado.erro) {
          alert(resultado.erro);
        } else if (resultado.sucesso) {
          alert(resultado.mensagem);
          form.reset();
          idClienteLogado = null; // Reseta o ID de controle local
          carregarDadosDoEstabelecimento(); 
          preencherDadosSeLogado(); // Recarrega os dados travados se a sessão persistir
        }

      } catch (erro) {
        console.error('Erro ao enviar:', erro);
        alert('Não foi possível conectar com o servidor para realizar o agendamento.');
      }
    });
  }

  // Inicialização paralela e limpa na abertura da página
  carregarDadosDoEstabelecimento();
  preencherDadosSeLogado();
});
