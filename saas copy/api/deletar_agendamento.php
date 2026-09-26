<?php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

verificarAcessoAPI('cliente');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dadosRecebidos = json_decode(file_get_contents('php://input'), true);
if (!$dadosRecebidos) {
    http_response_code(422);
    echo json_encode(['erro' => 'Nenhum dado foi enviado.']);
    exit;
}

$agendamentoId = isset($dadosRecebidos['agendamento_id']) ? (int) $dadosRecebidos['agendamento_id'] : 0;
$clienteId = (int) $_SESSION['cliente_id'];
$tenantId = (int) $_SESSION['tenant_id'];

if ($agendamentoId <= 0) {
    http_response_code(422);
    echo json_encode(['erro' => 'Informe um agendamento válido para cancelamento.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE agendamentos SET status = 'cancelado' WHERE id = :id AND cliente_id = :cliente_id AND tenant_id = :tenant_id AND status IN ('pendente', 'confirmado')");
    $stmt->execute([
        'id' => $agendamentoId,
        'cliente_id' => $clienteId,
        'tenant_id' => $tenantId,
    ]);

    if ($stmt->rowCount() <= 0) {
        http_response_code(404);
        echo json_encode(['erro' => 'Agendamento não encontrado ou indisponível para cancelamento.']);
        exit;
    }

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Agendamento cancelado com sucesso.',
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno no servidor ao cancelar o agendamento.']);
}
