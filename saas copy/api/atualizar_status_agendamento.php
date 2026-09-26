<?php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

verificarAcessoAPI('admin');

$tenantIdAdmin = (int) $_SESSION['tenant_id'];
$dadosRecebidos = json_decode(file_get_contents('php://input'), true);

if (!$dadosRecebidos) {
    http_response_code(422);
    echo json_encode(['erro' => 'Nenhum dado foi enviado.']);
    exit;
}

$agendamentoId = isset($dadosRecebidos['agendamento_id']) ? (int) $dadosRecebidos['agendamento_id'] : 0;
$novoStatus = trim((string) ($dadosRecebidos['status'] ?? ''));
$statusPermitidos = ['pendente', 'confirmado', 'concluido', 'cancelado'];

if (!$agendamentoId || $novoStatus === '') {
    http_response_code(422);
    echo json_encode(['erro' => 'ID do agendamento e o novo status são obrigatórios.']);
    exit;
}

if (!in_array($novoStatus, $statusPermitidos, true)) {
    http_response_code(422);
    echo json_encode(['erro' => 'O status informado é inválido para o sistema.']);
    exit;
}

try {
    $sql = 'UPDATE agendamentos SET status = :status WHERE id = :id AND tenant_id = :tenant_id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'status' => $novoStatus,
        'id' => $agendamentoId,
        'tenant_id' => $tenantIdAdmin,
    ]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Status do agendamento atualizado para '{$novoStatus}' com sucesso!",
        ]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['erro' => 'Agendamento não encontrado ou você não tem permissão para alterá-lo.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno no servidor ao atualizar o status.']);
}
