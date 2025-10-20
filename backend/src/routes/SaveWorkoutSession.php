<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../controllers/WorkoutController.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

try {
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Debug: Log the received data
    error_log("SaveWorkoutSession - Received data: " . json_encode($input));
    
    if (!$input) {
        error_log("SaveWorkoutSession - No input data received");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        exit();
    }

    // Debug: Check individual fields
    error_log("SaveWorkoutSession - workoutPlanId: " . (isset($input['workoutPlanId']) ? $input['workoutPlanId'] : 'NOT SET'));
    error_log("SaveWorkoutSession - planName: " . (isset($input['planName']) ? $input['planName'] : 'NOT SET'));
    error_log("SaveWorkoutSession - duration: " . (isset($input['duration']) ? $input['duration'] : 'NOT SET'));

    // Validate required fields
    if (!isset($input['workoutPlanId']) || !isset($input['planName']) || !isset($input['duration'])) {
        error_log("SaveWorkoutSession - Missing required fields");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Workout plan ID, plan name, and duration are required']);
        exit();
    }

    // Create controller instance and save workout session
    $workoutController = new WorkoutController();
    $response = $workoutController->createWorkoutSession(
        $userId,
        $input['workoutPlanId'],
        $input['planName'],
        $input['duration'],
        $input['rating'] ?? null
    );
    
    // Set appropriate HTTP status code
    if (!$response['success']) {
        http_response_code(400);
    }
    
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in SaveWorkoutSession: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
