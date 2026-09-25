<?php
// api/buscar_agendamentos_cliente.php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php'; // Adicione esta linha!

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Inicia a sessão para validar o login do PHP
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 1. PROTEÇÃO: Verifica se o cliente está realmente logado
if (!isset($_SESSION['cliente_logado']) || !isset($_SESSION['cliente_id'])) {
    http_response_code(401);
    echo json_encode(["erro" => "Não autorizado. Por favor, faça login."]);
    exit;
}

$clienteId = $_SESSION['cliente_id'];
$slug = isset($_GET['tenant']) ? trim($_GET['tenant']) : '';

if (empty($slug)) {
    echo json_encode(["erro" => "Nenhum estabelecimento foi informado."]);
    exit;
}

try {
    // 2. Busca o Tenant para garantir o ID numérico correto e o isolamento dos dados
    $stmtTenant = $pdo->prepare("SELECT id FROM tenants WHERE slug = :slug");
    $stmtTenant->execute(['slug' => $slug]);
    $tenant = $stmtTenant->fetch();

    if (!$tenant) {
        echo json_encode(["erro" => "Estabelecimento não encontrado."]);
        exit;
    }

    // 3. Busca os agendamentos do cliente trazendo dados do Serviço e do Produto Opcional (se houver)
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
        'tenant_id'  => $tenant['id']
    ]);
    
    $agendamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "sucesso" => true,
        "cliente_nome" => $_SESSION['cliente_nome'],
        "agendamentos" => $agendamentos
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro interno no servidor: " . $e->getMessage()]);
}
