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

// Check authentication - only trainees can cancel their own requests
checkAuth(['trainee']);

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
    
    // Verify the request belongs to this trainee and is pending
    $checkQuery = "SELECT trainer_id FROM coaching_requests 
                   WHERE id = ? AND trainee_id = ? AND status = 'pending'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("ii", $requestId, $userId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Request not found or already processed']);
        exit();
    }
    
    $row = $result->fetch_assoc();
    $trainerId = $row['trainer_id'];
    
    // Delete the request (or you could update status to 'cancelled')
    $deleteQuery = "DELETE FROM coaching_requests 
                    WHERE id = ? AND trainee_id = ? AND status = 'pending'";
    
    $stmt = $conn->prepare($deleteQuery);
    $stmt->bind_param("ii", $requestId, $userId);
    $stmt->execute();
    
    if ($stmt->affected_rows === 0) {
        throw new Exception('Failed to cancel request');
    }
    
    // Log the cancellation
    error_log("Trainee $userId cancelled coaching request $requestId to trainer $trainerId");
    
    echo json_encode([
        'success' => true,
        'message' => 'Coaching request cancelled successfully'
    ]);

} catch (Exception $e) {
    error_log("Error cancelling coaching request: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
