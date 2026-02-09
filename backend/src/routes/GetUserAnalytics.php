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

    // Get query parameters
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    $trainingPeriodId = isset($_GET['training_period_id']) ? intval($_GET['training_period_id']) : null;

    // Allow viewing analytics for oneself (trainee viewing their own analytics)
    // The userId from checkAuth() is the authenticated user (trainee)
    $analyticsModel = new AnalyticsModel();
    $analytics = $analyticsModel->getUserAnalytics($userId, $startDate, $endDate, $trainingPeriodId);

    echo json_encode([
        'success' => true,
        'user_id' => $userId,
        'analytics' => $analytics
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
