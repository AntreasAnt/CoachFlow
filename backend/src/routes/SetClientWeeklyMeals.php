<?php
// Route: SetClientWeeklyMeals.php
// Purpose: Set or update weekly meal plan for a specific client

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

$client_id = $input['client_id'] ?? null;
$day_of_week = $input['day_of_week'] ?? null; // 1 = Monday, 7 = Sunday
$meal_type = $input['meal_type'] ?? null; // breakfast, lunch, dinner, snack
$food_items = $input['food_items'] ?? [];
$notes = $input['notes'] ?? '';

if (!$client_id || $day_of_week === null || !$meal_type) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Client ID, day of week, and meal type required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Verify that this client belongs to the trainer
    $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                     WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
    $stmt = $conn->prepare($verify_query);
    $stmt->bind_param('ii', $trainer_id, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['count'] == 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    $stmt->close();
    
    // Check if client_meal_plans table exists, if not create it
    $create_table_query = "CREATE TABLE IF NOT EXISTS client_meal_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        trainer_id INT NOT NULL,
        day_of_week INT NOT NULL,
        meal_type VARCHAR(50) NOT NULL,
        food_items JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES user(userid) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES user(userid) ON DELETE CASCADE,
        UNIQUE KEY unique_meal (client_id, day_of_week, meal_type)
    )";
    $conn->query($create_table_query);
    
    $food_items_json = json_encode($food_items);
    
    // Check if meal already exists for this day/type
    $check_query = "SELECT id FROM client_meal_plans 
                    WHERE client_id = ? AND trainer_id = ? AND day_of_week = ? AND meal_type = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param('iiis', $client_id, $trainer_id, $day_of_week, $meal_type);
    $stmt->execute();
    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;
    $stmt->close();
    
    if ($exists) {
        // Update existing meal
        $query = "UPDATE client_meal_plans 
                  SET food_items = ?, notes = ?, updated_at = NOW()
                  WHERE client_id = ? AND trainer_id = ? AND day_of_week = ? AND meal_type = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ssiiss', $food_items_json, $notes, $client_id, $trainer_id, $day_of_week, $meal_type);
    } else {
        // Insert new meal
        $query = "INSERT INTO client_meal_plans 
                  (client_id, trainer_id, day_of_week, meal_type, food_items, notes) 
                  VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iiisss', $client_id, $trainer_id, $day_of_week, $meal_type, $food_items_json, $notes);
    }
    
    $stmt->execute();
    $stmt->close();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Meal plan saved successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
