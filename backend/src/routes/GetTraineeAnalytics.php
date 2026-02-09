<?php
define('APP_RUNNING', true);
require_once '../bootstrap.php';
require_once '../models/AnalyticsModel.php';
require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Check authentication (must be a trainer)
    checkAuth(['trainer']);
    $trainerId = $_SESSION['user_id'];
    
    if (!$trainerId) {
        throw new Exception('Trainer authentication required');
    }

    // Get trainee ID from query parameters
    $traineeId = isset($_GET['trainee_id']) ? intval($_GET['trainee_id']) : null;
    if (!$traineeId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'trainee_id is required'
        ]);
        exit();
    }

    // Verify that the trainer has an active coaching relationship with this trainee
    $database = new Database();
    $conn = $database->connect();
    
    $verifyQuery = "SELECT COUNT(*) as count FROM coaching_relationships 
                    WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
    $stmt = $conn->prepare($verifyQuery);
    $stmt->bind_param("ii", $trainerId, $traineeId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if ($row['count'] == 0) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'You do not have permission to view this trainee\'s analytics'
        ]);
        exit();
    }

    // Get query parameters for date range and training period
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    $trainingPeriodId = isset($_GET['training_period_id']) ? intval($_GET['training_period_id']) : null;

    // Get trainee information
    $traineeQuery = "SELECT userid, full_name, username, email FROM user WHERE userid = ?";
    $stmt = $conn->prepare($traineeQuery);
    $stmt->bind_param("i", $traineeId);
    $stmt->execute();
    $traineeResult = $stmt->get_result();
    $traineeInfo = $traineeResult->fetch_assoc();

    // Get analytics
    $analyticsModel = new AnalyticsModel();
    $analytics = $analyticsModel->getUserAnalytics($traineeId, $startDate, $endDate, $trainingPeriodId);

    echo json_encode([
        'success' => true,
        'trainee' => [
            'id' => $traineeInfo['userid'],
            'name' => $traineeInfo['full_name'] ?: $traineeInfo['username'],
            'email' => $traineeInfo['email']
        ],
        'analytics' => $analytics
    ]);

} catch (Exception $e) {
    error_log("GetTraineeAnalytics - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
