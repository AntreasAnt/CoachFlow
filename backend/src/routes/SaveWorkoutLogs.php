<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../controllers/WorkoutController.php';
require_once '../models/AnalyticsModel.php';

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
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        exit();
    }

    // Validate required fields
    if (!isset($input['sessionId']) || !isset($input['logs'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Session ID and logs are required']);
        exit();
    }

    // Create controller instance and save workout logs
    $workoutController = new WorkoutController();
    $response = $workoutController->saveWorkoutLogs($userId, $input['sessionId'], $input['logs']);
    
    // If logs saved successfully, calculate analytics
    if ($response['success']) {
        try {
            $analyticsModel = new AnalyticsModel();
            
            // Get workout session date and training period
            $database = new Database();
            $conn = $database->connect();
            $sessionQuery = "SELECT session_date, training_period_id FROM workout_sessions WHERE id = ?";
            $stmt = $conn->prepare($sessionQuery);
            $stmt->bind_param("i", $input['sessionId']);
            $stmt->execute();
            $sessionResult = $stmt->get_result();
            $sessionData = $sessionResult->fetch_assoc();
            
            $workoutDate = $sessionData['session_date'] ?? date('Y-m-d');
            $trainingPeriodId = $sessionData['training_period_id'] ?? null;
            
            // Calculate 1RM estimates
            $oneRMCount = $analyticsModel->calculate1RMForWorkout($userId, $input['sessionId'], $trainingPeriodId);
            
            // Update weekly volume summary
            $analyticsModel->updateWeeklyVolumeSummary($userId, $workoutDate);
            
            // Update workout streak
            $currentStreak = $analyticsModel->updateWorkoutStreak($userId, $workoutDate);
            
            // Detect and award achievements
            $newAchievements = $analyticsModel->detectAchievements($userId, $input['sessionId']);
            
            $response['analytics'] = [
                'one_rm_calculated' => $oneRMCount,
                'current_streak' => $currentStreak,
                'new_achievements' => $newAchievements
            ];
            
        } catch (Exception $analyticsError) {
            error_log("Analytics calculation error: " . $analyticsError->getMessage());
            // Don't fail the whole request if analytics fails
            $response['analytics_error'] = $analyticsError->getMessage();
        }
    }
    
    // Set appropriate HTTP status code
    if (!$response['success']) {
        http_response_code(400);
    }
    
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in SaveWorkoutLogs: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
