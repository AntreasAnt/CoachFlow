<?php
// Route: CreateTrainerCustomFood.php
// Purpose: Create a custom food that only the trainer and their trainees can see

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

$name = $input['name'] ?? null;
$brand = $input['brand'] ?? '';
$serving_size = $input['serving_size'] ?? 100;
$serving_unit = $input['serving_unit'] ?? 'g';
$calories = $input['calories'] ?? 0;
$protein = $input['protein'] ?? 0;
$carbs = $input['carbs'] ?? 0;
$fat = $input['fat'] ?? 0;
$portions = $input['portions'] ?? null; // JSON array of portions

if (!$name) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Food name is required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Create table if not exists
    $createTableQuery = "CREATE TABLE IF NOT EXISTS trainer_custom_foods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trainer_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) DEFAULT NULL,
        serving_size DECIMAL(10,2) DEFAULT 100,
        serving_unit VARCHAR(50) DEFAULT 'g',
        calories DECIMAL(10,2) DEFAULT 0,
        protein DECIMAL(10,2) DEFAULT 0,
        carbs DECIMAL(10,2) DEFAULT 0,
        fat DECIMAL(10,2) DEFAULT 0,
        portions JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_trainer (trainer_id),
        FOREIGN KEY (trainer_id) REFERENCES user(userid) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $conn->query($createTableQuery);
    
    // Insert custom food
    $query = "INSERT INTO trainer_custom_foods 
              (trainer_id, name, brand, serving_size, serving_unit, calories, protein, carbs, fat, portions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($query);
    $portions_json = $portions ? json_encode($portions) : null;
    $stmt->bind_param('isssdddds', 
        $trainer_id, 
        $name, 
        $brand, 
        $serving_size, 
        $serving_unit, 
        $calories, 
        $protein, 
        $carbs, 
        $fat,
        $portions_json
    );
    
    if ($stmt->execute()) {
        $food_id = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Custom food created successfully',
            'food_id' => $food_id
        ]);
    } else {
        throw new Exception('Failed to create custom food');
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("CreateTrainerCustomFood Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
