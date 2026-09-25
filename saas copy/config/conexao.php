<?php
// config/conexao.php

$host = 'localhost';
$db   = 'saas_agendamento';
$user = 'root';
$pass = ''; // No XAMPP a senha padrão é vazia
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     // Remova o comentário abaixo apenas para testar se conectou com sucesso
     // echo "Conectado ao banco com sucesso!"; 
} catch (\PDOException $e) {
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
