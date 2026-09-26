<?php
require_once '../config/controle_sessao.php';

header('Content-Type: application/json; charset=UTF-8');

limparSessaoAtual();

echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Sessão encerrada com sucesso.',
]);
