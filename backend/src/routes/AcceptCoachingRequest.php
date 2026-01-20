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
    
    $conn->begin_transaction();
    
    // Get request details
    $query = "SELECT trainee_id FROM coaching_requests 
              WHERE id = ? AND trainer_id = ? AND status = 'pending'";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $requestId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Request not found or already processed');
    }
    
    $request = $result->fetch_assoc();
    $traineeId = $request['trainee_id'];
    
    // Update request status
    $updateQuery = "UPDATE coaching_requests 
                    SET status = 'accepted', processed_at = NOW() 
                    WHERE id = ?";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("i", $requestId);
    $updateStmt->execute();
    
    // Create coaching relationship
    $insertQuery = "INSERT INTO coaching_relationships 
                    (trainer_id, trainee_id, status, started_at) 
                    VALUES (?, ?, 'active', NOW())";
    $insertStmt = $conn->prepare($insertQuery);
    $insertStmt->bind_param("ii", $userId, $traineeId);
    $insertStmt->execute();
    
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Coaching request accepted successfully'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    error_log("AcceptCoachingRequest - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
