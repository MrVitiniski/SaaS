<?php
// api/buscar_servicos.php

// Buscando a conexão na pasta correta (voltando uma pasta com '../' e entrando em 'config/')
require_once '../config/conexao.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$slug = isset($_GET['tenant']) ? trim($_GET['tenant']) : '';
$tipoFiltro = isset($_GET['tipo']) ? trim($_GET['tipo']) : ''; // Captura a nova coluna 'tipo' se enviada (ex: 'mecanica', 'pizzeria')

if (empty($slug)) {
    echo json_encode(["erro" => "Nenhum estabelecimento foi informado na URL."]);
    exit;
}

try {
    // 1. Busca se a empresa (Tenant) existe no MySQL
    $stmtTenant = $pdo->prepare("SELECT id, nome_empresa FROM tenants WHERE slug = :slug");
    $stmtTenant->execute(['slug' => $slug]);
    $tenant = $stmtTenant->fetch();

    if (!$tenant) {
        echo json_encode(["erro" => "Estabelecimento não encontrado em nosso sistema."]);
        exit;
    }

    // 2. Busca os serviços daquela empresa suportando a nova coluna 'tipo'
    // Montamos a query dinamicamente se o parâmetro 'tipo' for passado via URL
    $sql = "SELECT id, nome, preco, duracao_minutos, tipo FROM servicos WHERE tenant_id = :tenant_id";
    $params = ['tenant_id' => $tenant['id']];

    if (!empty($tipoFiltro)) {
        $sql .= " AND tipo = :tipo";
        $params['tipo'] = $tipoFiltro;
    }

    $stmtServicos = $pdo->prepare($sql);
    $stmtServicos->execute($params);
    $servicos = $stmtServicos->fetchAll(PDO::FETCH_ASSOC);

    // 3. Retorna o JSON completo para o JavaScript
    echo json_encode([
        "sucesso" => true,
        "empresa" => $tenant['nome_empresa'],
        "tenant_id" => $tenant['id'],
        "servicos" => $servicos
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro interno no servidor: " . $e->getMessage()]);
}
