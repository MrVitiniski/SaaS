<?php
// api/salvar_pedido.php
require_once '../config/conexao.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$dados = json_decode(file_get_contents("php://input"), true);

if (!$dados) {
    echo json_encode(["erro" => "Nenhum dado enviado."]);
    exit;
}

$tenant_id        = (int)$dados['tenant_id'];
$tipo_pedido      = trim($dados['tipo_pedido']); // 'entrega' ou 'retirada'
$cliente_nome     = trim($dados['cliente_nome']);
$cliente_whatsapp = trim($dados['cliente_whatsapp']);
$forma_pagamento  = trim($dados['forma_pagamento']); // 'pix', 'dinheiro', 'cartao'

// Endereço (pode ser nulo caso seja retirada)
$cep        = isset($dados['cep']) ? trim($dados['cep']) : null;
$bairro     = isset($dados['bairro']) ? trim($dados['bairro']) : null;
$rua        = isset($dados['rua']) ? trim($dados['rua']) : null;
$numero     = isset($dados['numero']) ? trim($dados['numero']) : null;
$referencia = isset($dados['referencia']) ? trim($dados['referencia']) : null;
$troco_para = isset($dados['troco_para']) ? (float)$dados['troco_para'] : null;

// Valores
$subtotal_comida = (float)$dados['subtotal_comida'];
$subtotal_bebida = (float)$dados['subtotal_bebida'];
$taxa_entrega    = (float)$dados['taxa_entrega'];
$total_pedido    = (float)$dados['total_pedido'];

// Gerar código do pedido baseado nos últimos 4 dígitos do WhatsApp
$ultimosDigitos = substr(preg_replace('/\D/', '', $cliente_whatsapp), -4);
$codigo_pedido = "PD-" . (!empty($ultimosDigitos) ? $ultimosDigitos : rand(1000, 9999));

try {
    $sql = "INSERT INTO pedidos_delivery (
                tenant_id, codigo_pedido, tipo_pedido, cliente_nome, cliente_whatsapp, 
                cep, bairro, rua, numero, referencia, forma_pagamento, troco_para, 
                subtotal_comida, subtotal_bebida, taxa_entrega, total_pedido, status
            ) VALUES (
                :tenant_id, :codigo_pedido, :tipo_pedido, :cliente_nome, :cliente_whatsapp, 
                :cep, :bairro, :rua, :numero, :referencia, :forma_pagamento, :troco_para, 
                :subtotal_comida, :subtotal_bebida, :taxa_entrega, :total_pedido, 'cozinha'
            )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'tenant_id'        => $tenant_id,
        'codigo_pedido'    => $codigo_pedido,
        'tipo_pedido'      => $tipo_pedido,
        'cliente_nome'     => $cliente_nome,
        'cliente_whatsapp' => $cliente_whatsapp,
        'cep'              => $cep,
        'bairro'           => $bairro,
        'rua'              => $rua,
        'numero'           => $numero,
        'referencia'       => $referencia,
        'forma_pagamento'  => $forma_pagamento,
        'troco_para'       => $troco_para,
        'subtotal_comida'  => $subtotal_comida,
        'subtotal_bebida'  => $subtotal_bebida,
        'taxa_entrega'     => $taxa_entrega,
        'total_pedido'     => $total_pedido
    ]);

    echo json_encode([
        "sucesso" => true,
        "codigo_pedido" => $codigo_pedido,
        "mensagem" => "Pedido cadastrado na cozinha com sucesso!"
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro ao processar pedido: " . $e->getMessage()]);
}
