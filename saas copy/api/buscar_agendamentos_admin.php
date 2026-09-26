<?php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

verificarAcessoAPI('admin');

$tenantIdAdmin = (int) $_SESSION['tenant_id'];

try {
    $sql = "SELECT 
                a.id,
                a.cliente_nome,
                a.cliente_telefone,
                a.cliente_email,
                a.data_agendamento,
                a.hora_agendamento,
                a.tipo,
                a.status,
                s.nome AS servico_nome,
                s.preco AS servico_preco,
                p.nome AS produto_nome,
                p.preco AS produto_preco
            FROM agendamentos a
            INNER JOIN servicos s ON a.servico_id = s.id
            LEFT JOIN produtos p ON a.produto_id = p.id
            WHERE a.tenant_id = :tenant_id
            ORDER BY a.data_agendamento ASC, a.hora_agendamento ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['tenant_id' => $tenantIdAdmin]);
    $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'sucesso' => true,
        'total_agendamentos' => count($agendamentos),
        'agendamentos' => $agendamentos,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno no servidor ao listar agenda.']);
}
