<?php
define('APP_RUNNING', true);
require_once '../bootstrap.php';
require_once '../config/cors.php';
require_once '../config/Auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Check authentication
    $userId = checkAuth();
    if (!$userId) {
        throw new Exception('Authentication required');
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $alertId = $data['alert_id'] ?? null;

    if (!$alertId) {
        throw new Exception('Alert ID required');
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Update alert
    $query = "UPDATE performance_alerts 
              SET dismissed = 1
              WHERE id = ? AND user_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $alertId, $userId);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        throw new Exception('Alert not found or already dismissed');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Alert dismissed'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
