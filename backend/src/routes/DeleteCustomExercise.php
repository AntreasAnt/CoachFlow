<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/WorkoutModel.php';

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer', 'trainee']);

try {
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['exerciseId'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Exercise ID is required']);
        exit();
    }

    $exerciseId = $input['exerciseId'];

    // Create model instance
    $workoutModel = new WorkoutModel();
    
    // Delete custom exercise
    $result = $workoutModel->deleteCustomExercise($userId, $exerciseId);
    
    if ($result['success']) {
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode($result);
    }

} catch (Exception $e) {
    error_log("Error in DeleteCustomExercise: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
