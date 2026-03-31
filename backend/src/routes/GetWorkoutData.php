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
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Optional includes + pagination (backwards compatible: no params => full payload)
    $toBool = function ($v, $default = true) {
        if ($v === null) return $default;
        $v = strtolower(trim((string)$v));
        if ($v === '0' || $v === 'false' || $v === 'no') return false;
        if ($v === '1' || $v === 'true' || $v === 'yes') return true;
        return $default;
    };

    $includePlans = $toBool($_GET['include_plans'] ?? null, true);
    $includeRecentSessions = $toBool($_GET['include_recent_sessions'] ?? null, true);
    $includeExercises = $toBool($_GET['include_exercises'] ?? null, true);
    $includePremiumPlans = $toBool($_GET['include_premium_plans'] ?? null, true);
    $includePersonalRecords = $toBool($_GET['include_personal_records'] ?? null, true);

    $plansPage = isset($_GET['plans_page']) ? max(1, (int)$_GET['plans_page']) : null;
    $plansLimit = isset($_GET['plans_limit']) ? max(1, min(50, (int)$_GET['plans_limit'])) : null;
    $plansIncludeDetails = $toBool($_GET['plans_include_details'] ?? null, true);

    $options = [
        'includePlans' => $includePlans,
        'includeRecentSessions' => $includeRecentSessions,
        'includeExercises' => $includeExercises,
        'includePremiumPlans' => $includePremiumPlans,
        'includePersonalRecords' => $includePersonalRecords
    ];

    if ($plansPage !== null && $plansLimit !== null) {
        $options['plansPage'] = $plansPage;
        $options['plansLimit'] = $plansLimit;
        $options['plansIncludeDetails'] = $plansIncludeDetails;
    }

    // Create controller instance and get workout data
    $workoutController = new WorkoutController();
    $response = $workoutController->getWorkoutData($userId, $options);
    
    // Set appropriate HTTP status code
    if (!$response['success']) {
        http_response_code(400);
    }
    
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in GetWorkoutData: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
