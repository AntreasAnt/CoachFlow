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
    
    // Get all training periods for the user
    $query = "SELECT 
                tp.id,
                tp.period_name,
                tp.start_date,
                tp.end_date,
                tp.is_active,
                tp.notes,
                tp.trainer_id,
                u.name as trainer_name,
                u.imageid as trainer_image,
                COUNT(DISTINCT ws.id) as workouts_count
              FROM training_periods tp
              LEFT JOIN user u ON tp.trainer_id = u.userid
              LEFT JOIN workout_sessions ws ON ws.training_period_id = tp.id
              WHERE tp.user_id = ?
              GROUP BY tp.id
              ORDER BY tp.start_date DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $periods = [];
    while ($row = $result->fetch_assoc()) {
        $periods[] = $row;
    }

    echo json_encode([
        'success' => true,
        'periods' => $periods
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
