<?php
// api/buscar_agendamentos_admin.php

require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// 1. PROTEÇÃO DE ACESSO: Verifica se há uma sessão ativa antes de entregar os dados
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Nota: Futuramente, você pode criar uma variável $_SESSION['is_admin'] para blindar ainda mais aqui.
if (!isset($_SESSION['tenant_id'])) {
    http_response_code(401);
    echo json_encode(["erro" => "Não autorizado. Sessão administrativa inválida ou expirada."]);
    exit;
}

// O tenant_id administrativo vem direto da sessão segura do dono após ele fazer o login admin
$tenantIdAdmin = (int)$_SESSION['tenant_id'];

try {
    // 2. QUERY ADMINISTRATIVA: Busca TODOS os agendamentos daquele tenant, sem filtrar por cliente específico
    // Faz o INNER JOIN com serviços e LEFT JOIN com produtos opcionais e a nova tabela de clientes
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

    // 3. RETORNO DO JSON PARA O PAINEL DASHBOARD
    echo json_encode([
        "sucesso" => true,
        "total_agendamentos" => count($agendamentos),
        "agendamentos" => $agendamentos
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro interno no servidor ao listar agenda: " . $e->getMessage()]);
}
