<?php
require_once '../config/conexao.php';

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

$nome = trim((string) ($dadosRecebidos['nome'] ?? ''));
$email = filter_var(trim((string) ($dadosRecebidos['email'] ?? '')), FILTER_VALIDATE_EMAIL);
$telefone = trim((string) ($dadosRecebidos['telefone'] ?? ''));
$senha = trim((string) ($dadosRecebidos['senha'] ?? ''));
$tenantId = filter_var($dadosRecebidos['tenant_id'] ?? 0, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: 0;
$telefoneNormalizado = preg_replace('/\D+/', '', $telefone);

if ($nome === '' || !$email || $senha === '' || !$tenantId || $telefoneNormalizado === '') {
    http_response_code(422);
    echo json_encode(['erro' => 'Nome, e-mail, telefone, senha e estabelecimento são obrigatórios.']);
    exit;
}

if (mb_strlen($nome) < 3) {
    http_response_code(422);
    echo json_encode(['erro' => 'Informe um nome com pelo menos 3 caracteres.']);
    exit;
}

if (strlen($telefoneNormalizado) < 10) {
    http_response_code(422);
    echo json_encode(['erro' => 'Informe um telefone válido com DDD.']);
    exit;
}

if (strlen($senha) < 6) {
    http_response_code(422);
    echo json_encode(['erro' => 'A senha deve ter pelo menos 6 caracteres.']);
    exit;
}

try {
    $stmtCheck = $pdo->prepare('SELECT id FROM clientes WHERE email = :email AND tenant_id = :tenant_id LIMIT 1');
    $stmtCheck->execute([
        'email' => $email,
        'tenant_id' => $tenantId,
    ]);

    if ($stmtCheck->fetch()) {
        http_response_code(409);
        echo json_encode(['erro' => 'Este e-mail já está cadastrado neste estabelecimento.']);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $sql = 'INSERT INTO clientes (tenant_id, nome, email, telefone, senha, criado_em) VALUES (:tenant_id, :nome, :email, :telefone, :senha, NOW())';
    $stmtInsert = $pdo->prepare($sql);
    $stmtInsert->execute([
        'tenant_id' => $tenantId,
        'nome' => $nome,
        'email' => $email,
        'telefone' => $telefone,
        'senha' => $senhaHash,
    ]);

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Cadastro realizado com sucesso! Agora você pode fazer o seu login.',
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao realizar o cadastro no banco de dados.']);
}
