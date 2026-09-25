<?php
// api/identificar_tenant.php
require_once '../config/conexao.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$slug = isset($_GET['tenant']) ? trim($_GET['tenant']) : '';

if (empty($slug)) {
    echo json_encode(["erro" => "Nenhum estabelecimento informado."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, nome_empresa, segmento FROM tenants WHERE slug = :slug");
    $stmt->execute(['slug' => $slug]);
    $tenant = $stmt->fetch();

    if (!$tenant) {
        echo json_encode(["erro" => "Estabelecimento não encontrado."]);
        exit;
    }

    echo json_encode([
        "sucesso" => true,
        "tenant_id" => $tenant['id'],
        "empresa" => $tenant['nome_empresa'],
        "segmento" => $tenant['segmento'] // 'Beleza' ou 'Alimentação'
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => $e->getMessage()]);
}
