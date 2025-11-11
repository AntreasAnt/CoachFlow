<?php
/**
 * Get Nutrition Goal Endpoint
 * 
 * Retrieves the user's active nutrition goal
 * Method: GET
 * URL: /backend/src/routes/GetNutritionGoal.php
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
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Get nutrition goal
    $model = new NutritionModel();
    $goal = $model->getActiveGoal($userId);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'goal' => $goal
    ]);
    
} catch (Exception $e) {
    error_log("Get nutrition goal endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
