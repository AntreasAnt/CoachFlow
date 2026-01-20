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
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get transaction history (for now, just purchases - can be extended)
    $query = "SELECT 
                pp.id,
                pp.amount,
                pp.purchased_at as date,
                'Program Sale' as type,
                CONCAT('Sale of ', tp.title) as description,
                pp.status
              FROM program_purchases pp
              JOIN trainer_programs tp ON pp.program_id = tp.id
              WHERE tp.trainer_id = ?
              AND pp.status = 'completed'
              ORDER BY pp.purchased_at DESC
              LIMIT 50";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }

    echo json_encode([
        'success' => true,
        'transactions' => $transactions
    ]);

} catch (Exception $e) {
    error_log("GetTrainerTransactions - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
