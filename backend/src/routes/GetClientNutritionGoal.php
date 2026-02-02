<?php
// Route: GetClientNutritionGoal.php
// Purpose: Get nutrition goal for a specific client

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

$client_id = $_GET['client_id'] ?? null;

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
    
    // Get trainer-assigned goal
    $trainer_goal_query = "SELECT * FROM nutrition_goals 
                          WHERE user_id = ? AND source = 'trainer' AND assigned_by_trainer_id = ?
                          ORDER BY updated_at DESC LIMIT 1";
    $stmt = $conn->prepare($trainer_goal_query);
    $stmt->bind_param('ii', $client_id, $trainer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trainer_goal = null;
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $trainer_goal = [
            'id' => (int)$row['id'],
            'goal_type' => $row['goal_type'],
            'target_calories' => (int)$row['target_calories'],
            'target_protein' => (int)$row['target_protein'],
            'target_carbs' => (int)$row['target_carbs'],
            'target_fat' => (int)$row['target_fat'],
            'source' => 'trainer',
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    $stmt->close();
    
    // Get self-created goal
    $self_goal_query = "SELECT * FROM nutrition_goals 
                       WHERE user_id = ? AND source = 'self'
                       ORDER BY updated_at DESC LIMIT 1";
    $stmt = $conn->prepare($self_goal_query);
    $stmt->bind_param('i', $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $self_goal = null;
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $self_goal = [
            'id' => (int)$row['id'],
            'goal_type' => $row['goal_type'],
            'target_calories' => (int)$row['target_calories'],
            'target_protein' => (int)$row['target_protein'],
            'target_carbs' => (int)$row['target_carbs'],
            'target_fat' => (int)$row['target_fat'],
            'source' => 'self',
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    $stmt->close();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'trainer_goal' => $trainer_goal,
        'self_goal' => $self_goal
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
