<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/config/cors.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get all training periods for the user with workout counts
    $query = "SELECT 
                tp.id,
                tp.period_name,
                tp.start_date,
                tp.end_date,
                tp.is_active,
                tp.notes,
                tp.created_at,
                u.name as trainer_name,
                COUNT(DISTINCT ws.id) as workouts_count
              FROM training_periods tp
              LEFT JOIN users u ON tp.trainer_id = u.user_id
              LEFT JOIN workout_sessions ws ON ws.training_period_id = tp.id
              WHERE tp.user_id = :user_id
              GROUP BY tp.id
              ORDER BY tp.is_active DESC, tp.start_date DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $periods = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data
    foreach ($periods as &$period) {
        $period['is_active'] = (bool)$period['is_active'];
        $period['workouts_count'] = (int)$period['workouts_count'];
    }

    echo json_encode([
        'success' => true,
        'periods' => $periods
    ]);

} catch (Exception $e) {
    error_log("GetTrainingPeriods Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch training periods: ' . $e->getMessage()
    ]);
}
