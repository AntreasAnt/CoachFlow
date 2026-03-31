<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../controllers/WorkoutController.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 10;

    $includeDetails = false;
    if (isset($_GET['include_details'])) {
        $v = strtolower(trim((string)$_GET['include_details']));
        $includeDetails = in_array($v, ['1', 'true', 'yes'], true);
    }

    $workoutController = new WorkoutController();
    $response = $workoutController->getUserWorkoutPlansPaged($userId, $page, $limit, $includeDetails);

    if (!$response['success']) {
        http_response_code(400);
    }

    echo json_encode($response);
} catch (Exception $e) {
    error_log('Error in GetUserWorkoutPlans: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
