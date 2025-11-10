<?php
/**
 * Manage Custom Foods Endpoint
 * 
 * CRUD operations for custom foods
 * Methods: GET (list), POST (create), PUT (update), DELETE (delete)
 * URL: /backend/src/routes/ManageCustomFoods.php
 */

require_once __DIR__ . "/../config/cors.php";

require_once '../config/Database.php';
require_once '../models/NutritionModel.php';

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    $model = new NutritionModel();
    
    // GET - List all custom foods
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $foods = $model->getCustomFoods($userId);
        $count = $model->getCustomFoodsCount($userId);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'foods' => $foods,
            'count' => $count,
            'limit' => 50,
            'remaining' => max(0, 50 - $count)
        ]);
        exit;
    }
    
    // POST - Create new custom food
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
            exit;
        }
        
        // Validate required fields
        $required = ['name', 'serving_size', 'serving_unit', 'calories', 'protein', 'carbs', 'fat'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
                exit;
            }
        }
        
        $foodData = [
            'name' => $input['name'],
            'brand_name' => $input['brand_name'] ?? null,
            'serving_size' => (float)$input['serving_size'],
            'serving_unit' => $input['serving_unit'],
            'calories' => (float)$input['calories'],
            'protein' => (float)$input['protein'],
            'carbs' => (float)$input['carbs'],
            'fat' => (float)$input['fat'],
            'fiber' => isset($input['fiber']) ? (float)$input['fiber'] : null,
            'sugar' => isset($input['sugar']) ? (float)$input['sugar'] : null,
            'sodium' => isset($input['sodium']) ? (float)$input['sodium'] : null,
            'notes' => $input['notes'] ?? null
        ];
        
        $result = $model->createCustomFood($userId, $foodData);
        
        if ($result['success']) {
            http_response_code(201);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
        exit;
    }
    
    // PUT - Update custom food
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid request']);
            exit;
        }
        
        $foodId = (int)$input['id'];
        
        $foodData = [
            'name' => $input['name'],
            'brand_name' => $input['brand_name'] ?? null,
            'serving_size' => (float)$input['serving_size'],
            'serving_unit' => $input['serving_unit'],
            'calories' => (float)$input['calories'],
            'protein' => (float)$input['protein'],
            'carbs' => (float)$input['carbs'],
            'fat' => (float)$input['fat'],
            'fiber' => isset($input['fiber']) ? (float)$input['fiber'] : null,
            'sugar' => isset($input['sugar']) ? (float)$input['sugar'] : null,
            'sodium' => isset($input['sodium']) ? (float)$input['sodium'] : null,
            'notes' => $input['notes'] ?? null
        ];
        
        $success = $model->updateCustomFood($userId, $foodId, $foodData);
        
        if ($success) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Custom food updated successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Failed to update custom food']);
        }
        exit;
    }
    
    // DELETE - Delete custom food
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $foodId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        
        if (!$foodId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Food ID is required']);
            exit;
        }
        
        $success = $model->deleteCustomFood($userId, $foodId);
        
        if ($success) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Custom food deleted successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Failed to delete custom food']);
        }
        exit;
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    
} catch (Exception $e) {
    error_log("Manage custom foods endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
