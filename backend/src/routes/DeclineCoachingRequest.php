<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

    $input = json_decode(file_get_contents('php://input'), true);
    $requestId = $input['requestId'] ?? null;
    
    if (!$requestId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Request ID is required']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Update request status to declined
    $query = "UPDATE coaching_requests 
              SET status = 'declined', processed_at = NOW() 
              WHERE id = ? AND trainer_id = ? AND status = 'pending'";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $requestId, $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        throw new Exception('Request not found or already processed');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Coaching request declined'
    ]);

} catch (Exception $e) {
    error_log("DeclineCoachingRequest - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
