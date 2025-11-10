<?php
/**
 * Get Food Logs Endpoint
 * 
 * Retrieves food logs for a date range
 * Method: GET
 * URL: /backend/src/routes/GetFoodLogs.php
 * Parameters: start_date, end_date, meal_type (optional)
 */

require_once __DIR__ . "/../config/cors.php";

require_once '../config/Database.php';
require_once '../models/NutritionModel.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d');
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : $startDate;
    $mealType = isset($_GET['meal_type']) ? $_GET['meal_type'] : null;
    
    $model = new NutritionModel();
    $logs = $model->getFoodLogs($userId, $startDate, $endDate, $mealType);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'count' => count($logs),
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Get food logs endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
