<?php
// config/controle_sessao.php

// --- AJUSTE DE SEGURANÇA E DURAÇÃO DA SESSÃO ---
// Define o tempo de vida da sessão para 24 horas (86400 segundos)
ini_set('session.cookie_lifetime', 86400);
ini_set('session.gc_maxlifetime', 86400);

ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);

// Configura os parâmetros do cookie para funcionar perfeitamente no seu ambiente Localhost
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400,
        'path' => '/',
        'domain' => 'localhost', // Garante que o cookie vale para o localhost independentemente da porta (:8080)
        'secure' => false,       // false porque você está desenvolvendo em HTTP normal e não HTTPS
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    
    session_start();
}
// -----------------------------------------------

/**
 * Função para proteger páginas visíveis (HTML/PHP do painel)
 * Se o cliente não estiver logado, chuta ele de volta para o login com o tenant correto
 */
function verificarAcessoPainel() {
    if (!isset($_SESSION['cliente_logado']) || $_SESSION['cliente_logado'] !== true) {
        // Captura o tenant atual da URL para não perder o escopo do cliente
        $tenantSlug = isset($_GET['tenant']) ? trim($_GET['tenant']) : 'barbearia-premium';
        
        // Redireciona o usuário para a tela de login
        header("Location: login.html?tenant=" . urlencode($tenantSlug));
        exit;
    }
}

/**
 * Função para proteger requisições de APIs que retornam JSON
 * Se não estiver logado, retorna um erro HTTP 401 imediatamente
 */
function verificarAcessoAPI() {
    if (!isset($_SESSION['cliente_logado']) || $_SESSION['cliente_logado'] !== true) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(["erro" => "Sessão inválida ou expirada. Faça login novamente."]);
        exit;
    }
}
