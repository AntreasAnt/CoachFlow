<?php
// Route: GetClientPrograms.php
// Purpose: Get workout programs created by a specific client (for trainer view)

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication - only trainers can view client programs
checkAuth(['trainer']);

$clientId = $_GET['client_id'] ?? null;

if (!$clientId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Client ID is required']);
    exit();
}

try {
    $trainerId = $_SESSION['user_id'] ?? null;
    
    if (!$trainerId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();

    // Verify that this client belongs to the trainer
    $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                     WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
    $stmt = $conn->prepare($verify_query);
    $stmt->bind_param('ii', $trainerId, $clientId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();
    
    if ($row['count'] == 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied - client relationship not found']);
        exit();
    }

    // Get client's self-created workout programs
    // Check both user_workout_plans and premium_workout_plans tables
    $programs = [];
    
    // Get from user_workout_plans (trainee's custom plans)
    $query1 = "SELECT id, name as title, description, category, difficulty_level, 
                      duration_weeks, 0 as price, 'user_plan' as source,
                      created_at, created_at as updated_at
               FROM user_workout_plans 
               WHERE user_id = ? 
               ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($query1);
    $stmt->bind_param('i', $clientId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['duration_weeks'] = (int)$row['duration_weeks'];
        $row['price'] = (float)$row['price'];
        $programs[] = $row;
    }
    $stmt->close();
    
    // Get from premium_workout_plans (trainee's published plans)
    $query2 = "SELECT id, title, description, category, difficulty_level, 
                      duration_weeks, price, 'premium_plan' as source,
                      created_at, created_at as updated_at
               FROM premium_workout_plans 
               WHERE created_by_trainer_id = ? 
               ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($query2);
    $stmt->bind_param('i', $clientId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['duration_weeks'] = (int)$row['duration_weeks'];
        $row['price'] = (float)$row['price'];
        $programs[] = $row;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'programs' => $programs,
        'count' => count($programs)
    ]);

} catch (Exception $e) {
    error_log("GetClientPrograms - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>