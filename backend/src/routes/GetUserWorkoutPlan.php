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

    $planId = $_GET['planId'] ?? $_GET['plan_id'] ?? null;
    if (!$planId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required parameter: planId']);
        exit();
    }

    $workoutController = new WorkoutController();
    $response = $workoutController->getUserWorkoutPlan($userId, $planId);

    if (!$response['success']) {
        http_response_code(404);
    }

    echo json_encode($response);
} catch (Exception $e) {
    error_log('Error in GetUserWorkoutPlan: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
