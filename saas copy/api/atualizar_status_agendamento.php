<?php
// api/atualizar_status_agendamento.php

require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// 1. Inicia a sessão e valida se o usuário é um administrador logado
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['tenant_id'])) {
    http_response_code(401);
    echo json_encode(["erro" => "Não autorizado. Sessão administrativa inválida ou expirada."]);
    exit;
}

// Resgata o tenant do administrador direto da sessão do servidor
$tenantIdAdmin = (int)$_SESSION['tenant_id'];

// Captura os dados enviados via JSON pelo JavaScript (fetch)
$dadosRecebidos = json_decode(file_get_contents("php://input"), true);

if (!$dadosRecebidos) {
    echo json_encode(["erro" => "Nenhum dado foi enviado."]);
    exit;
}

$agendamentoId = isset($dadosRecebidos['agendamento_id']) ? (int)$dadosRecebidos['agendamento_id'] : 0;
$novoStatus    = isset($dadosRecebidos['status']) ? trim($dadosRecebidos['status']) : '';

// 2. Lista de status permitidos no sistema para evitar inserção de lixo no banco
$statusPermitidos = ['pendente', 'confirmado', 'concluido', 'cancelado'];

if (!$agendamentoId || empty($novoStatus)) {
    echo json_encode(["erro" => "ID do agendamento e o novo status são obrigatórios."]);
    exit;
}

if (!in_array($novoStatus, $statusPermitidos)) {
    echo json_encode(["erro" => "O status informado é inválido para o sistema."]);
    exit;
}

try {
    // 3. EXECUÇÃO SEGURA COM ISOLAMENTO DE TENANT
    // O 'AND tenant_id = :tenant_id' garante que um admin do tenant A não consiga alterar agendamentos do tenant B
    $sql = "UPDATE agendamentos 
            SET status = :status 
            WHERE id = :id AND tenant_id = :tenant_id";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'status'    => $novoStatus,
        'id'        => $agendamentoId,
        'tenant_id' => $tenantIdAdmin
    ]);

    // Verifica se alguma linha foi de fato alterada no MySQL
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Status do agendamento atualizado para '" . $novoStatus . "' com sucesso!"
        ]);
    } else {
        // Se bater aqui, o agendamento não existe ou não pertence a este administrador
        echo json_encode(["erro" => "Agendamento não encontrado ou você não tem permissão para alterá-lo."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro interno no servidor ao atualizar o status: " . $e->getMessage()]);
}
