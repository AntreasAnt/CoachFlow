<?php
session_start();
header('Content-Type: application/json');

echo json_encode([
    'session' => $_SESSION,
    'user_id' => $_SESSION['user_id'] ?? 'NOT SET',
    'role' => $_SESSION['role'] ?? 'NOT SET',
    'user_privileges' => $_SESSION['user_privileges'] ?? 'NOT SET'
]);
?>