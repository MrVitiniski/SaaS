<?php

$sessionLifetime = 86400;
$useSecureCookie = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

ini_set('session.cookie_lifetime', (string) $sessionLifetime);
ini_set('session.gc_maxlifetime', (string) $sessionLifetime);
ini_set('session.cookie_httponly', '1');
ini_set('session.use_only_cookies', '1');

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => $sessionLifetime,
        'path' => '/',
        'secure' => $useSecureCookie,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function usuarioEhCliente() {
    return isset($_SESSION['cliente_logado'], $_SESSION['cliente_id']) && $_SESSION['cliente_logado'] === true;
}

function usuarioEhAdmin() {
    return isset($_SESSION['admin_logado'], $_SESSION['tenant_id']) && $_SESSION['admin_logado'] === true;
}

function usuarioEstaLogado($tipo = null) {
    if ($tipo === 'admin') {
        return usuarioEhAdmin();
    }

    if ($tipo === 'cliente') {
        return usuarioEhCliente();
    }

    return usuarioEhCliente() || usuarioEhAdmin();
}

function limparSessaoAtual() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'] ?? '',
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();
}

function verificarAcessoPainel($tipo = 'cliente') {
    if (usuarioEstaLogado($tipo)) {
        return;
    }

    $tenantSlug = isset($_GET['tenant']) ? trim((string) $_GET['tenant']) : '';

    if ($tipo === 'admin') {
        header('Location: login_admin.html');
        exit;
    }

    $destino = 'login.html';
    if ($tenantSlug !== '') {
        $destino .= '?tenant=' . urlencode($tenantSlug);
    }

    header('Location: ' . $destino);
    exit;
}

function verificarAcessoAPI($tipo = 'cliente') {
    if (usuarioEstaLogado($tipo)) {
        return;
    }

    http_response_code(401);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['erro' => 'Sessão inválida ou expirada. Faça login novamente.']);
    exit;
}
