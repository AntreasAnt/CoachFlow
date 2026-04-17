<?php
// Route: UpdateTrainerCustomFood.php
// Purpose: Update an existing custom food for the trainer

session_start();

if (!defined('APP_RUNNING')) {
    define('APP_RUNNING', true);
}

include_once("../config/cors.php");
include_once("../config/Database.php");

// Check authentication
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if user is a trainer
$userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
if ($userRole !== 'trainer') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$id = $input['id'] ?? null;
$name = $input['name'] ?? null;
$brand = $input['brand'] ?? '';
$serving_size = $input['serving_size'] ?? 100;
$serving_unit = $input['serving_unit'] ?? 'g';
$calories = $input['calories'] ?? 0;
$protein = $input['protein'] ?? 0;
$carbs = $input['carbs'] ?? 0;
$fat = $input['fat'] ?? 0;

if (!$id || !$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Food ID and name are required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Check if the custom food exists and belongs to the trainer
    $checkQuery = "SELECT id FROM trainer_custom_foods WHERE id = ? AND trainer_id = ?";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param('ii', $id, $trainer_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Custom food not found or access denied']);
        exit;
    }
    $checkStmt->close();

    // Update custom food (without portions)
    $query = "UPDATE trainer_custom_foods SET 
                name = ?, brand = ?, serving_size = ?, serving_unit = ?, 
                calories = ?, protein = ?, carbs = ?, fat = ? 
              WHERE id = ? AND trainer_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ssdsddddii', 
        $name, 
        $brand, 
        $serving_size, 
        $serving_unit, 
        $calories, 
        $protein, 
        $carbs, 
        $fat,
        $id,
        $trainer_id
    );
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Custom food updated successfully'
        ]);
    } else {
        throw new Exception('Failed to update custom food');
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("UpdateTrainerCustomFood Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}