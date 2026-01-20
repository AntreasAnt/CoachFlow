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

// Check authentication
checkAuth(['trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get pending coaching requests
    $query = "SELECT 
                cr.id,
                cr.trainee_id,
                cr.message,
                cr.experience_level,
                cr.goals,
                cr.created_at,
                u.full_name as trainee_name,
                u.email as trainee_email
              FROM coaching_requests cr
              JOIN user u ON cr.trainee_id = u.userid
              WHERE cr.trainer_id = ?
              AND cr.status = 'pending'
              ORDER BY cr.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }

    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);

} catch (Exception $e) {
    error_log("GetCoachingRequests - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
