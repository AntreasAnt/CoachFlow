<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Only admins can search users
checkAuth(['admin']);

$q = trim((string)($_GET['q'] ?? ''));
$limit = (int)($_GET['limit'] ?? 10);
if ($limit < 1 || $limit > 50) {
    $limit = 10;
}

try {
    $conn = (new Database())->connect();

    if ($q === '') {
        $stmt = $conn->prepare(
            "SELECT userid AS id, full_name, username, email, role
             FROM user
             WHERE isdeleted = 0 AND isdisabled = 0
             ORDER BY username ASC
             LIMIT ?"
        );
        $stmt->bind_param('i', $limit);
    } else {
        $pattern = '%' . $q . '%';
        $stmt = $conn->prepare(
            "SELECT userid AS id, full_name, username, email, role
             FROM user
             WHERE isdeleted = 0 AND isdisabled = 0
               AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)
             ORDER BY username ASC
             LIMIT ?"
        );
        $stmt->bind_param('sssi', $pattern, $pattern, $pattern, $limit);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => $row['id'],
            'full_name' => $row['full_name'] ?? null,
            'username' => $row['username'] ?? null,
            'email' => $row['email'] ?? null,
            'role' => $row['role'] ?? null,
        ];
    }

    $stmt->close();

    echo json_encode(['success' => true, 'users' => $users]);
} catch (Exception $e) {
    error_log('Error in SearchUsers: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}
