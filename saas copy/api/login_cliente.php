<?php
// api/login_cliente.php
require_once '../config/conexao.php';

// INCLUSÃO CRÍTICA: Carrega as regras de cookie e inicia a sessão de forma idêntica ao resto do sistema
require_once '../config/controle_sessao.php'; 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$dadosRecebidos = json_decode(file_get_contents("php://input"), true);

if (!$dadosRecebidos) {
    echo json_encode(["erro" => "Nenhum dado enviado."]);
    exit;
}

$email     = isset($dadosRecebidos['email']) ? trim($dadosRecebidos['email']) : '';
$senha     = isset($dadosRecebidos['senha']) ? trim($dadosRecebidos['senha']) : '';
$tenant_id = isset($dadosRecebidos['tenant_id']) ? (int)$dadosRecebidos['tenant_id'] : 0;

if (empty($email) || empty($senha) || !$tenant_id) {
    echo json_encode(["erro" => "E-mail, senha e estabelecimento são obrigatórios."]);
    exit;
}

try {
    // Busca o usuário travando pelo tenant_id para evitar vazamento de dados inter-tenant
    $stmt = $pdo->prepare("SELECT id, nome, email, senha FROM clientes WHERE email = :email AND tenant_id = :tenant_id");
    $stmt->execute([
        'email' => $email,
        'tenant_id' => $tenant_id
    ]);
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verifica se o usuário existe e se a senha do bcrypt confere
    if ($cliente && password_verify($senha, $cliente['senha'])) {
        
        // Armazena as chaves de controle na sessão do servidor (agora persistente e padronizada)
        $_SESSION['cliente_logado'] = true;
        $_SESSION['cliente_id']     = $cliente['id'];
        $_SESSION['cliente_nome']   = $cliente['nome'];
        $_SESSION['tenant_id']      = $tenant_id;

        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Login realizado com sucesso!",
            "cliente" => [
                "id" => $cliente['id'],
                "nome" => $cliente['nome']
            ]
        ]);
    } else {
        echo json_encode(["erro" => "Usuário ou senha incorretos para este estabelecimento."]);
    }

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro interno no servidor: " . $e->getMessage()]);
}
