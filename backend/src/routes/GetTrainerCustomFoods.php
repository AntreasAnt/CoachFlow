<?php
// Route: GetTrainerCustomFoods.php
// Purpose: Get all custom foods created by the trainer or by the trainee's trainers

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

try {
    $db = new Database();
    $conn = $db->connect();
    
    $user_id = $_SESSION['user_id'];
    $userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
    
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'trainer_custom_foods'");
    if ($tableCheck->num_rows == 0) {
        echo json_encode(['success' => true, 'foods' => []]);
        exit;
    }
    
    if ($userRole === 'trainer') {
        // Trainer sees only their own custom foods
        $query = "SELECT id, name, brand, serving_size, serving_unit, 
                         calories, protein, carbs, fat, portions, created_at
                  FROM trainer_custom_foods
                  WHERE trainer_id = ?
                  ORDER BY name ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $user_id);
    } else {
        // Trainee sees custom foods from all their trainers
        $query = "SELECT tcf.id, tcf.name, tcf.brand, tcf.serving_size, tcf.serving_unit,
                         tcf.calories, tcf.protein, tcf.carbs, tcf.fat, tcf.portions, 
                         tcf.created_at, u.username as trainer_name
                  FROM trainer_custom_foods tcf
                  JOIN coaching_relationships cr ON tcf.trainer_id = cr.trainer_id
                  JOIN user u ON tcf.trainer_id = u.userid
                  WHERE cr.trainee_id = ? AND cr.status = 'active'
                  ORDER BY tcf.name ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $user_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $foods = [];
    while ($row = $result->fetch_assoc()) {
        $food = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'brand' => $row['brand'],
            'serving_size' => (float)$row['serving_size'],
            'serving_unit' => $row['serving_unit'],
            'calories' => (float)$row['calories'],
            'protein' => (float)$row['protein'],
            'carbs' => (float)$row['carbs'],
            'fat' => (float)$row['fat'],
            'portions' => $row['portions'] ? json_decode($row['portions'], true) : [],
            'created_at' => $row['created_at']
        ];
        
        if (isset($row['trainer_name'])) {
            $food['trainer_name'] = $row['trainer_name'];
        }
        
        $foods[] = $food;
    }
    
    $stmt->close();
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'foods' => $foods
    ]);
    
} catch (Exception $e) {
    error_log("GetTrainerCustomFoods Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
