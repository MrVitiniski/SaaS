<?php
// api/logout_cliente.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Limpa e destroi a sessão
$_SESSION = array();
session_destroy();

header("Content-Type: application/json");
echo json_encode(["sucesso" => true, "mensagem" => "Sessão encerrada."]);
