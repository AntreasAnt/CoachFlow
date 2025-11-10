<?php
/**
 * Set Nutrition Goal Endpoint
 * 
 * Sets user's nutrition goals (daily/weekly calories and macros)
 * Method: POST
 * URL: /backend/src/routes/SetNutritionGoal.php
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
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
        exit;
    }
    
    // Validate required fields
    if (!isset($input['goal_type']) || !isset($input['target_calories'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        exit;
    }
    
    // Validate goal_type
    if (!in_array($input['goal_type'], ['daily', 'weekly'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid goal_type. Must be daily or weekly']);
        exit;
    }
    
    $model = new NutritionModel();
    
    $goalData = [
        'goal_type' => $input['goal_type'],
        'target_calories' => (int)$input['target_calories'],
        'target_protein' => isset($input['target_protein']) ? (float)$input['target_protein'] : null,
        'target_carbs' => isset($input['target_carbs']) ? (float)$input['target_carbs'] : null,
        'target_fat' => isset($input['target_fat']) ? (float)$input['target_fat'] : null
    ];
    
    $goalId = $model->setNutritionGoal($userId, $goalData);
    
    if ($goalId) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'goal_id' => $goalId,
            'message' => 'Nutrition goal set successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to set nutrition goal'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Set nutrition goal endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
