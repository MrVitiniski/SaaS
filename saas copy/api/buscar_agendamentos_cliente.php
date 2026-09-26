<?php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

verificarAcessoAPI('cliente');

$clienteId = (int) $_SESSION['cliente_id'];
$tenantIdSessao = (int) $_SESSION['tenant_id'];
$slug = isset($_GET['tenant']) ? trim((string) $_GET['tenant']) : '';

if ($slug === '') {
    http_response_code(422);
    echo json_encode(['erro' => 'Nenhum estabelecimento foi informado.']);
    exit;
}

try {
    $stmtTenant = $pdo->prepare('SELECT id FROM tenants WHERE slug = :slug LIMIT 1');
    $stmtTenant->execute(['slug' => $slug]);
    $tenant = $stmtTenant->fetch();

    if (!$tenant || (int) $tenant['id'] !== $tenantIdSessao) {
        http_response_code(403);
        echo json_encode(['erro' => 'Você não tem permissão para acessar este estabelecimento.']);
        exit;
    }

    $sql = "SELECT 
                a.id,
                a.data_agendamento,
                a.hora_agendamento,
                a.status,
                s.nome AS servico_nome,
                s.preco AS servico_preco,
                p.nome AS produto_nome,
                p.preco AS produto_preco
            FROM agendamentos a
            INNER JOIN servicos s ON a.servico_id = s.id
            LEFT JOIN produtos p ON a.produto_id = p.id
            WHERE a.cliente_id = :cliente_id AND a.tenant_id = :tenant_id
            ORDER BY a.data_agendamento DESC, a.hora_agendamento DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'cliente_id' => $clienteId,
        'tenant_id' => $tenantIdSessao,
    ]);

    $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'sucesso' => true,
        'cliente_nome' => $_SESSION['cliente_nome'],
        'agendamentos' => $agendamentos,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno no servidor.']);
}
