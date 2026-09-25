<?php
// api/checar_sessao.php
require_once '../config/conexao.php';
require_once '../config/controle_sessao.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Verifica se o cliente está logado na sessão
if (isset($_SESSION['cliente_logado']) && $_SESSION['cliente_logado'] === true && isset($_SESSION['cliente_id'])) {
    try {
        // Busca os dados atualizados diretamente no banco de dados
        $stmt = $pdo->prepare("SELECT nome, telefone, email FROM clientes WHERE id = :id");
        $stmt->execute(['id' => $_SESSION['cliente_id']]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cliente) {
            echo json_encode([
                "logado" => true,
                "cliente" => [
                    "nome"     => $cliente['nome'],
                    "telefone" => $cliente['telefone'],
                    "email"    => $cliente['email']
                ]
            ]);
            exit;
        }
    } catch (PDOException $e) {
        // Silencia o erro de banco para o front e retorna falso
    }
}

echo json_encode(["logado" => false]);
