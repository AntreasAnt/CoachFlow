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

try {
    // Check authentication
    $userId = checkAuth();
    if (!$userId) {
        throw new Exception('Authentication required');
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get performance alerts
    $query = "SELECT 
                id,
                alert_type,
                severity,
                title,
                message,
                alert_date,
                is_read,
                dismissed,
                metadata,
                created_at
              FROM performance_alerts
              WHERE user_id = ?
                AND dismissed = 0
              ORDER BY alert_date DESC, created_at DESC
              LIMIT 20";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $alerts = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['metadata']) {
            $row['metadata'] = json_decode($row['metadata'], true);
        }
        $alerts[] = $row;
    }

    echo json_encode([
        'success' => true,
        'alerts' => $alerts,
        'unread_count' => count(array_filter($alerts, fn($a) => !$a['is_read']))
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
