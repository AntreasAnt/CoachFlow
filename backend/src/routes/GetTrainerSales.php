<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    error_log("GetTrainerSales - Starting request");
    
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get program sales with customer details
    $query = "SELECT 
                pp.id,
                pp.amount,
                pp.purchased_at,
                pp.status,
                tp.title as program_title,
                u.full_name as trainee_name,
                u.email as trainee_email
              FROM program_purchases pp
              JOIN trainer_programs tp ON pp.program_id = tp.id
              JOIN user u ON pp.trainee_id = u.userid
              WHERE tp.trainer_id = ?
              AND pp.status = 'completed'
              ORDER BY pp.purchased_at DESC
              LIMIT 100";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sales = [];
    while ($row = $result->fetch_assoc()) {
        $sales[] = $row;
    }
    
    error_log("GetTrainerSales - Found " . count($sales) . " sales");

    echo json_encode([
        'success' => true,
        'sales' => $sales
    ]);

} catch (Exception $e) {
    error_log("GetTrainerSales - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
