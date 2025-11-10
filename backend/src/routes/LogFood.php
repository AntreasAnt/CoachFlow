<?php
/**
 * Log Food Endpoint
 * 
 * Logs a food entry for the user
 * Method: POST
 * URL: /backend/src/routes/LogFood.php
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
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit;
    }
    
    // Validate required fields
    $required = ['log_date', 'meal_type', 'food_source', 'food_id', 'food_name', 'quantity', 'serving_size', 'serving_unit', 'calories', 'protein', 'carbs', 'fat'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    $model = new NutritionModel();
    
    $logData = [
        'log_date' => $input['log_date'],
        'meal_type' => $input['meal_type'],
        'food_source' => $input['food_source'],
        'food_id' => (int)$input['food_id'],
        'food_name' => $input['food_name'],
        'serving_size' => (float)$input['serving_size'],
        'serving_unit' => $input['serving_unit'],
        'quantity' => (float)$input['quantity'],
        'calories' => (float)$input['calories'],
        'protein' => (float)$input['protein'],
        'carbs' => (float)$input['carbs'],
        'fat' => (float)$input['fat'],
        'fiber' => isset($input['fiber']) ? (float)$input['fiber'] : null,
        'sugar' => isset($input['sugar']) ? (float)$input['sugar'] : null,
        'sodium' => isset($input['sodium']) ? (float)$input['sodium'] : null,
        'notes' => $input['notes'] ?? null
    ];
    
    $logId = $model->logFood($userId, $logData);
    
    if ($logId) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'log_id' => $logId,
            'message' => 'Food logged successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to log food']);
    }
    
} catch (Exception $e) {
    error_log("Log food endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
