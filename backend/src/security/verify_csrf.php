<?php
if (!defined('APP_RUNNING')) { 
    http_response_code(403); 
    exit('Forbidden'); 
}

function verifyCsrf(): void {
    // Only enforce on state-changing methods
    if (!in_array($_SERVER['REQUEST_METHOD'], ['POST','PUT','PATCH','DELETE'], true)) {
        return;
    }

    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $header  = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $cookie  = $_COOKIE['XSRF-TOKEN']        ?? '';
    $session = $_SESSION['csrf']             ?? '';

    if (!$header || !$cookie || !$session ||
        !hash_equals($session, $cookie) ||
        !hash_equals($session, $header)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'CSRF token invalid']);
        exit;
    }
}