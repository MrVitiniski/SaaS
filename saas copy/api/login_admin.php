<?php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dadosRecebidos = json_decode(file_get_contents('php://input'), true);
if (!$dadosRecebidos) {
    $dadosRecebidos = $_POST;
}

$email = filter_var(trim((string) ($dadosRecebidos['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$senha = trim((string) ($dadosRecebidos['senha'] ?? ''));

if (!$email || $senha === '') {
    http_response_code(422);
    echo json_encode(['erro' => 'E-mail e senha são obrigatórios.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, slug, nome_empresa, senha_admin FROM tenants WHERE email_admin = :email_admin LIMIT 1');
    $stmt->execute(['email_admin' => $email]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tenant || !password_verify($senha, $tenant['senha_admin'])) {
        http_response_code(401);
        echo json_encode(['erro' => 'E-mail ou senha administrativa inválidos.']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION = [
        'usuario_tipo' => 'admin',
        'admin_logado' => true,
        'tenant_id' => (int) $tenant['id'],
        'tenant_slug' => $tenant['slug'],
        'admin_nome' => $tenant['nome_empresa'],
    ];

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Autenticação corporativa realizada com sucesso! Bem-vindo ao painel administrativo.',
        'admin' => [
            'nome' => $tenant['nome_empresa'],
            'tenant_id' => (int) $tenant['id'],
            'tenant_slug' => $tenant['slug'],
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno no servidor.']);
}
