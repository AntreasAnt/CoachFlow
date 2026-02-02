<?php
define('APP_RUNNING', true);
require_once '../bootstrap.php';
require_once '../models/AnalyticsModel.php';
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

    $data = json_decode(file_get_contents('php://input'), true);
    
    $sessionId = $data['session_id'] ?? null;
    $workoutDate = $data['workout_date'] ?? date('Y-m-d');
    $trainingPeriodId = $data['training_period_id'] ?? null;

    if (!$sessionId) {
        throw new Exception('Session ID required');
    }

    $analyticsModel = new AnalyticsModel();
    
    // Calculate 1RM for this workout
    $oneRMCount = $analyticsModel->calculate1RMForWorkout($userId, $sessionId, $trainingPeriodId);
    
    // Update weekly volume summary
    $analyticsModel->updateWeeklyVolumeSummary($userId, $workoutDate);
    
    // Update workout streak
    $currentStreak = $analyticsModel->updateWorkoutStreak($userId, $workoutDate);
    
    // Detect and award achievements
    $newAchievements = $analyticsModel->detectAchievements($userId, $sessionId);

    echo json_encode([
        'success' => true,
        'one_rm_calculated' => $oneRMCount,
        'current_streak' => $currentStreak,
        'new_achievements' => $newAchievements,
        'achievements_count' => count($newAchievements)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
