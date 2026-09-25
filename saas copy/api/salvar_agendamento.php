<?php
// api/salvar_agendamento.php

require_once '../config/conexao.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Inicia a sessão para capturar o cliente se ele estiver logado no painel
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$dadosRecebidos = json_decode(file_get_contents("php://input"), true);

if (!$dadosRecebidos) {
    echo json_encode(["erro" => "Nenhum dado foi enviado."]);
    exit;
}

// Captura e limpa os campos enviados pelo formulário
$tenant_id        = isset($dadosRecebidos['tenant_id']) ? (int)$dadosRecebidos['tenant_id'] : 0;
$servico_id       = isset($dadosRecebidos['servico_id']) ? (int)$dadosRecebidos['servico_id'] : 0;

// Trata o produto_id de forma segura (se for menor ou igual a zero, vira NULL)
$produto_id = isset($dadosRecebidos['produto_id']) ? (int)$dadosRecebidos['produto_id'] : 0;
if ($produto_id <= 0) {
    $produto_id = null;
}

$data_agendamento = isset($dadosRecebidos['data_agendamento']) ? trim($dadosRecebidos['data_agendamento']) : '';
$hora_agendamento = isset($dadosRecebidos['hora_agendamento']) ? trim($dadosRecebidos['hora_agendamento']) : '';
$cliente_nome     = isset($dadosRecebidos['cliente_nome']) ? trim($dadosRecebidos['cliente_nome']) : '';
$cliente_telefone = isset($dadosRecebidos['cliente_telefone']) ? trim($dadosRecebidos['cliente_telefone']) : '';
$cliente_email    = isset($dadosRecebidos['cliente_email']) ? trim($dadosRecebidos['cliente_email']) : null;
$tipo             = isset($dadosRecebidos['tipo']) ? trim($dadosRecebidos['tipo']) : ''; 

// VÍNCULO DA SESSÃO: Primeiro checa a sessão do servidor PHP
$cliente_id_vinculo = isset($_SESSION['cliente_logado']) ? (int)$_SESSION['cliente_id'] : 0;

// BLINDAGEM DA CHAVE ESTRANGEIRA: Se não veio da sessão, checa se o JavaScript enviou no corpo do JSON
if ($cliente_id_vinculo <= 0 && isset($dadosRecebidos['cliente_id'])) {
    $cliente_id_vinculo = (int)$dadosRecebidos['cliente_id'];
}

// Se o ID resultante for inválido, nulo ou menor/igual a zero, força um NULL real do MySQL
if ($cliente_id_vinculo <= 0) {
    $cliente_id_vinculo = null;
}

// Validação básica dos campos obrigatórios
if (!$tenant_id || !$servico_id || empty($data_agendamento) || empty($hora_agendamento) || empty($cliente_nome) || empty($cliente_telefone) || empty($tipo)) {
    echo json_encode(["erro" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

try {
    // Insere o agendamento vinculando o cliente_id de forma 100% íntegra (ID válido ou NULL)
    $sql = "INSERT INTO agendamentos (tenant_id, servico_id, produto_id, cliente_id, data_agendamento, hora_agendamento, cliente_nome, cliente_telefone, cliente_email, tipo, status) 
            VALUES (:tenant_id, :servico_id, :produto_id, :cliente_id, :data_agendamento, :hora_agendamento, :cliente_nome, :cliente_telefone, :cliente_email, :tipo, 'pendente')";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'tenant_id'        => $tenant_id,
        'servico_id'       => $servico_id,
        'produto_id'       => $produto_id, 
        'cliente_id'       => $cliente_id_vinculo, 
        'data_agendamento' => $data_agendamento,
        'hora_agendamento' => $hora_agendamento,
        'cliente_nome'     => $cliente_nome,
        'cliente_telefone' => $cliente_telefone,
        'cliente_email'    => !empty($cliente_email) ? $cliente_email : null,
        'tipo'             => $tipo
    ]);

    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Agendamento realizado com sucesso para " . $cliente_nome . "!"
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro ao salvar o agendamento no banco de dados: " . $e->getMessage()]);
}
