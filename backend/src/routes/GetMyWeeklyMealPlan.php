<?php
// Route: GetMyWeeklyMealPlan.php
// Purpose: Allow trainee to view their trainer-assigned weekly meal plan

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication - allow both trainees and trainers
checkAuth(['trainee', 'trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    $userRole = $_SESSION['user_privileges'] ?? 'trainee';
    
    // If user is a trainer, they can view client's plan via client_id parameter
    if ($userRole === 'trainer') {
        $client_id = $_GET['client_id'] ?? null;
        
        if (!$client_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Client ID required for trainer']);
            exit();
        }
        
        // Verify trainer has access to this client
        $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                         WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
        $stmt = $conn->prepare($verify_query);
        $stmt->bind_param('ii', $userId, $client_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Access denied']);
            exit();
        }
        
        $target_user_id = $client_id;
    } else {
        // Trainee viewing their own meal plan
        $target_user_id = $userId;
    }
    
    // Get weekly meal plan
    $query = "SELECT cmp.*, 
                     DATE_FORMAT(cmp.created_at, '%Y-%m-%d %H:%i') as created_at_formatted,
                     u.username as trainer_name
              FROM client_meal_plans cmp
              LEFT JOIN user u ON cmp.trainer_id = u.userid
              WHERE cmp.client_id = ?
              ORDER BY cmp.day_of_week ASC, cmp.meal_type ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $target_user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $meals = [];
    while ($row = $result->fetch_assoc()) {
        // Keep food_items as JSON string for frontend to parse
        // Don't parse it here to avoid double parsing
        $meals[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'meals' => $meals,
        'count' => count($meals)
    ]);

} catch (Exception $e) {
    error_log("GetMyWeeklyMealPlan - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>