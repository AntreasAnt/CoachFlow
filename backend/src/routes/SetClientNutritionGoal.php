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
    
    error_log("SetClientNutritionGoal: trainer_id=$trainer_id, client_id=$client_id");
    
    // Verify that this client belongs to the trainer
    $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                     WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
    $stmt = $conn->prepare($verify_query);
    $stmt->bind_param('ii', $trainer_id, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    error_log("SetClientNutritionGoal: Active relationships found: " . $row['count']);
    
    if ($row['count'] == 0) {
        // Check if any relationship exists (regardless of status)
        $check_query = "SELECT trainer_id, trainee_id, status FROM coaching_relationships 
                       WHERE trainer_id = ? AND trainee_id = ?";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bind_param('ii', $trainer_id, $client_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $rel_data = $check_result->fetch_assoc();
        
        error_log("SetClientNutritionGoal: Any relationship: " . json_encode($rel_data));
        
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => 'Access denied - No active coaching relationship found',
            'debug' => [
                'trainer_id' => $trainer_id,
                'client_id' => $client_id,
                'relationship' => $rel_data
            ]
        ]);
        exit;
    }
    $stmt->close();
    
    // Check if trainer-assigned goal exists for this user
    $check_query = "SELECT id FROM nutrition_goals WHERE user_id = ? AND source = 'trainer' AND assigned_by_trainer_id = ?";
    $stmt = $conn->prepare($check_query);
    $stmt->bind_param('ii', $client_id, $trainer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $exists = $result->num_rows > 0;
    $stmt->close();
    
    if ($exists) {
        // Update existing trainer-assigned goal
        $query = "UPDATE nutrition_goals 
                  SET goal_type = ?, target_calories = ?, target_protein = ?, 
                      target_carbs = ?, target_fat = ?, updated_at = NOW()
                  WHERE user_id = ? AND source = 'trainer' AND assigned_by_trainer_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('siiiiii', $goal_type, $target_calories, $target_protein, 
                         $target_carbs, $target_fat, $client_id, $trainer_id);
    } else {
        // Insert new trainer-assigned goal (does not overwrite self-created goals)
        $query = "INSERT INTO nutrition_goals 
                  (user_id, assigned_by_trainer_id, source, goal_type, target_calories, target_protein, target_carbs, target_fat) 
                  VALUES (?, ?, 'trainer', ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('iisiiii', $client_id, $trainer_id, $goal_type, $target_calories, $target_protein, 
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
