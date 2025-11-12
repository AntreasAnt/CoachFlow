<?php
/**
 * Delete Food Log Endpoint
 * 
 * Deletes a food log entry for the user
 * Method: POST
 * URL: /backend/src/routes/DeleteFoodLog.php
 */

require_once __DIR__ . "/../config/cors.php";

require_once '../config/Database.php';
require_once '../models/NutritionModel.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['log_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing log_id']);
        exit;
    }
    
    $logId = $input['log_id'];
    
    $model = new NutritionModel();
    
    $result = $model->deleteFoodLog($userId, $logId);
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Food log deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to delete food log']);
    }
} catch (Exception $e) {
    error_log("Error deleting food log: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
