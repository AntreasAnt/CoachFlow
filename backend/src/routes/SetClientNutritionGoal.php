<?php
// Route: SetClientNutritionGoal.php
// Purpose: Set or update nutrition goal for a specific client

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
$goal_type = $input['goal_type'] ?? 'daily';
$target_calories = $input['target_calories'] ?? 0;
$target_protein = $input['target_protein'] ?? 0;
$target_carbs = $input['target_carbs'] ?? 0;
$target_fat = $input['target_fat'] ?? 0;

if (!$client_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Client ID required']);
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
    
    // Check if goal exists for this user
    $check_query = "SELECT id FROM nutrition_goals WHERE user_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;
    $stmt->close();
    
    if ($exists) {
        // Update existing goal
        $query = "UPDATE nutrition_goals 
                  SET goal_type = ?, target_calories = ?, target_protein = ?, 
                      target_carbs = ?, target_fat = ?, created_at = NOW()
                  WHERE user_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('siiiii', $goal_type, $target_calories, $target_protein, 
                         $target_carbs, $target_fat, $client_id);
    } else {
        // Insert new goal
        $query = "INSERT INTO nutrition_goals 
                  (user_id, goal_type, target_calories, target_protein, target_carbs, target_fat, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, NOW())";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('isiiii', $client_id, $goal_type, $target_calories, $target_protein, 
                         $target_carbs, $target_fat);
    }
    
    $stmt->execute();
    $stmt->close();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Nutrition goal set successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
