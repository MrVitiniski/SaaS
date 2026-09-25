<?php
// api/registrar_cliente.php
require_once '../config/conexao.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$dadosRecebidos = json_decode(file_get_contents("php://input"), true);

if (!$dadosRecebidos) {
    echo json_encode(["erro" => "Nenhum dado enviado."]);
    exit;
}

$nome      = isset($dadosRecebidos['nome']) ? trim($dadosRecebidos['nome']) : '';
$email     = isset($dadosRecebidos['email']) ? trim($dadosRecebidos['email']) : '';
$telefone  = isset($dadosRecebidos['telefone']) ? trim($dadosRecebidos['telefone']) : '';
$senha     = isset($dadosRecebidos['senha']) ? trim($dadosRecebidos['senha']) : '';
$tenant_id = isset($dadosRecebidos['tenant_id']) ? (int)$dadosRecebidos['tenant_id'] : 0;

// Validação dos campos obrigatórios
if (empty($nome) || empty($email) || empty($senha) || !$tenant_id) {
    echo json_encode(["erro" => "Por favor, preencha todos os campos obrigatórios."]);
    exit;
}

try {
    // 1. Verifica se já existe um cliente com este e-mail NESTE estabelecimento específico
    $stmtCheck = $pdo->prepare("SELECT id FROM clientes WHERE email = :email AND tenant_id = :tenant_id");
    $stmtCheck->execute([
        'email' => $email,
        'tenant_id' => $tenant_id
    ]);
    
    if ($stmtCheck->fetch()) {
        echo json_encode(["erro" => "Este e-mail já está cadastrado neste estabelecimento."]);
        exit;
    }

    // 2. Criptografa a senha de forma totalmente segura usando bcrypt nativo do PHP
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);

    // 3. Insere o novo cliente amarrado ao tenant_id correto
    $sql = "INSERT INTO clientes (tenant_id, nome, email, telefone, senha, criado_em) 
            VALUES (:tenant_id, :nome, :email, :telefone, :senha, NOW())";
            
    $stmtInsert = $pdo->prepare($sql);
    $stmtInsert->execute([
        'tenant_id' => $tenant_id,
        'nome'      => $nome,
        'email'     => $email,
        'telefone'  => !empty($telefone) ? $telefone : null,
        'senha'     => $senhaHash
    ]);

    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Cadastro realizado com sucesso! Agora você pode fazer o seu login."
    ]);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro ao realizar o cadastro no banco de dados: " . $e->getMessage()]);
}
