<?php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

if (usuarioEhCliente()) {
    try {
        $stmt = $pdo->prepare('SELECT id, nome, telefone, email, tenant_id FROM clientes WHERE id = :id AND tenant_id = :tenant_id LIMIT 1');
        $stmt->execute([
            'id' => $_SESSION['cliente_id'],
            'tenant_id' => $_SESSION['tenant_id'],
        ]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cliente) {
            echo json_encode([
                'logado' => true,
                'tipo' => 'cliente',
                'tenant_id' => (int) $cliente['tenant_id'],
                'cliente' => [
                    'id' => (int) $cliente['id'],
                    'nome' => $cliente['nome'],
                    'telefone' => $cliente['telefone'],
                    'email' => $cliente['email'],
                ],
            ]);
            exit;
        }
    } catch (PDOException $e) {
    }
}

if (usuarioEhAdmin()) {
    echo json_encode([
        'logado' => true,
        'tipo' => 'admin',
        'tenant_id' => (int) $_SESSION['tenant_id'],
        'admin' => [
            'nome' => $_SESSION['admin_nome'] ?? 'Administrador',
            'tenant_slug' => $_SESSION['tenant_slug'] ?? null,
        ],
    ]);
    exit;
}

echo json_encode(['logado' => false]);
