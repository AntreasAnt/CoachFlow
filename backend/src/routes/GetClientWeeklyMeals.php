<?php
// Route: GetClientWeeklyMeals.php
// Purpose: Get weekly meal plan for a specific client

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
    
    // Get weekly meal plan
    $query = "SELECT * FROM client_meal_plans 
              WHERE client_id = ? AND trainer_id = ?
              ORDER BY day_of_week, meal_type";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $client_id, $trainer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $meals = [];
    while ($row = $result->fetch_assoc()) {
        $meals[] = [
            'id' => (int)$row['id'],
            'day_of_week' => (int)$row['day_of_week'],
            'meal_type' => $row['meal_type'],
            'food_items' => json_decode($row['food_items'], true),
            'notes' => $row['notes'],
            'created_at' => $row['created_at']
        ];
    }
    
    $stmt->close();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'meals' => $meals
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
