<?php
// api/buscar_cardapio.php
require_once '../config/conexao.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$slug = isset($_GET['tenant']) ? trim($_GET['tenant']) : '';

if (empty($slug)) {
    echo json_encode(["erro" => "Nenhum estabelecimento informado."]);
    exit;
}

try {
    // 1. Busca se o restaurante existe e pega o ID dele
    $stmtTenant = $pdo->prepare("SELECT id FROM tenants WHERE slug = :slug AND segmento = 'Alimentação'");
    $stmtTenant->execute(['slug' => $slug]);
    $tenant = $stmtTenant->fetch();

    if (!$tenant) {
        echo json_encode(["erro" => "Restaurante não encontrado."]);
        exit;
    }

    $tenant_id = $tenant['id'];

    // 2. Busca todas as categorias deste restaurante
    $stmtCategorias = $pdo->prepare("SELECT id, nome FROM categorias_cardapio WHERE tenant_id = :tenant_id");
    $stmtCategorias->execute(['tenant_id' => $tenant_id]);
    $categorias = $stmtCategorias->fetchAll();

    // 3. Monta a estrutura do cardápio agrupado por categoria
    $cardapioCompleto = [];

    foreach ($categorias as $cat) {
        $stmtProdutos = $pdo->prepare("SELECT id, nome, descricao, preco, imagem_url FROM produtos WHERE tenant_id = :tenant_id AND categoria_id = :categoria_id AND disponivel = TRUE");
        $stmtProdutos->execute([
            'tenant_id' => $tenant_id,
            'categoria_id' => $cat['id']
        ]);
        $produtos = $stmtProdutos->fetchAll();

        $cardapioCompleto[] = [
            "categoria" => $cat['nome'],
            "produtos" => $produtos
        ];
    }

    echo json_encode([
        "sucesso" => true,
        "tenant_id" => $tenant_id,
        "cardapio" => $cardapioCompleto
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro no servidor: " . $e->getMessage()]);
}
