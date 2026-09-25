<?php
// api/login_admin.php

require_once '../config/conexao.php';
require_once '../config/controle_sessao.php'; 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["erro" => "Método não permitido."]);
    exit;
}

$dadosRecebidos = json_decode(file_get_contents("php://input"), true);
if (!$dadosRecebidos) {
    $dadosRecebidos = $_POST;
}

$email = isset($dadosRecebidos['email']) ? trim($dadosRecebidos['email']) : '';
$senha = isset($dadosRecebidos['senha']) ? trim($dadosRecebidos['senha']) : '';

if (empty($email) || empty($senha)) {
    echo json_encode(["erro" => "E-mail e senha são obrigatórios."]);
    exit;
}

try {
    // Busca o estabelecimento de forma segura travando o escopo
    $stmt = $pdo->prepare("SELECT id, nome_empresa, senha_admin FROM tenants WHERE email_admin = :email_admin LIMIT 1");
    $stmt->execute(['email_admin' => $email]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($tenant && password_verify($senha, $tenant['senha_admin'])) {
        
        // Define as credenciais de sessão do dono do negócio
        $_SESSION['cliente_logado'] = true; 
        $_SESSION['tenant_id']      = (int)$tenant['id'];
        $_SESSION['admin_nome']     = $tenant['nome_empresa'];

        echo json_encode([
            "sucesso" => true,
            "mensagem" => "Autenticação corporativa realizada com sucesso! Bem-vindo ao painel administrativo."
        ]);
    } else {
        echo json_encode(["erro" => "E-mail ou senha administrativa inválidos."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro interno no servidor: " . $e->getMessage()]);
}
