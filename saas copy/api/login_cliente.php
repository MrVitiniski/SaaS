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
$tenantId = filter_var($dadosRecebidos['tenant_id'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: 0;

if (!$email || $senha === '' || !$tenantId) {
    http_response_code(422);
    echo json_encode(['erro' => 'E-mail, senha e estabelecimento são obrigatórios.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, nome, email, telefone, senha FROM clientes WHERE email = :email AND tenant_id = :tenant_id LIMIT 1');
    $stmt->execute([
        'email' => $email,
        'tenant_id' => $tenantId,
    ]);
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cliente || !password_verify($senha, $cliente['senha'])) {
        http_response_code(401);
        echo json_encode(['erro' => 'Usuário ou senha incorretos para este estabelecimento.']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION = [
        'usuario_tipo' => 'cliente',
        'cliente_logado' => true,
        'cliente_id' => (int) $cliente['id'],
        'cliente_nome' => $cliente['nome'],
        'tenant_id' => $tenantId,
    ];

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Login realizado com sucesso!',
        'cliente' => [
            'id' => (int) $cliente['id'],
            'nome' => $cliente['nome'],
            'email' => $cliente['email'],
            'telefone' => $cliente['telefone'],
        ],
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno no servidor.']);
}
