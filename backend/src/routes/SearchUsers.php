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
if ($limit < 1 || $limit > 100) {
    $limit = 10;
}
$page = (int)($_GET['page'] ?? 1);
if ($page < 1) {
    $page = 1;
}

$offset = ($page - 1) * $limit;

try {
    $conn = (new Database())->connect();

    if ($q === '') {
        $countStmt = $conn->prepare("SELECT COUNT(*) AS total FROM user WHERE isdeleted = 0 AND isdisabled = 0");
        $countStmt->execute();
        $totalResult = $countStmt->get_result();
        $totalCount = $totalResult->fetch_assoc()['total'] ?? 0;
        $countStmt->close();

        $stmt = $conn->prepare(
            "SELECT userid AS id, full_name, username, email, role
             FROM user
             WHERE isdeleted = 0 AND isdisabled = 0
             ORDER BY username ASC
             LIMIT ? OFFSET ?"
        );
        $stmt->bind_param('ii', $limit, $offset);
    } else {
        $pattern = '%' . $q . '%';
        
        $countStmt = $conn->prepare("SELECT COUNT(*) AS total FROM user WHERE isdeleted = 0 AND isdisabled = 0 AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)");
        $countStmt->bind_param('sss', $pattern, $pattern, $pattern);
        $countStmt->execute();
        $totalResult = $countStmt->get_result();
        $totalCount = $totalResult->fetch_assoc()['total'] ?? 0;
        $countStmt->close();

        $stmt = $conn->prepare(
            "SELECT userid AS id, full_name, username, email, role
             FROM user
             WHERE isdeleted = 0 AND isdisabled = 0
               AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)
             ORDER BY username ASC
             LIMIT ? OFFSET ?"
        );
        $stmt->bind_param('sssii', $pattern, $pattern, $pattern, $limit, $offset);
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

    echo json_encode([
        'success' => true, 
        'users' => $users, 
        'pagination' => [
            'total' => $totalCount,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($totalCount / $limit)
        ]
    ]);
} catch (Exception $e) {
    error_log('Error in SearchUsers: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}
