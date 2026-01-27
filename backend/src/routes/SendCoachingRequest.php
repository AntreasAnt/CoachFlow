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

// Check authentication - only trainees can send coaching requests
checkAuth(['trainee']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $trainerId = $input['trainerId'] ?? null;
    $message = $input['message'] ?? '';
    $experienceLevel = $input['experienceLevel'] ?? '';
    $goals = $input['goals'] ?? '';
    
    if (!$trainerId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Trainer ID is required']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Check if user already has an active relationship with this trainer
    $checkQuery = "SELECT id FROM coaching_relationships 
                   WHERE trainee_id = ? AND trainer_id = ? AND status = 'active'";
    $checkStmt = $conn->prepare($checkQuery);
    $checkStmt->bind_param("ii", $userId, $trainerId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'You already have an active relationship with this trainer'
        ]);
        exit();
    }
    
    // Check if there's already a pending request
    $pendingQuery = "SELECT id FROM coaching_requests 
                     WHERE trainee_id = ? AND trainer_id = ? AND status = 'pending'";
    $pendingStmt = $conn->prepare($pendingQuery);
    $pendingStmt->bind_param("ii", $userId, $trainerId);
    $pendingStmt->execute();
    $pendingResult = $pendingStmt->get_result();
    
    if ($pendingResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'You already have a pending request with this trainer'
        ]);
        exit();
    }
    
    // Verify trainer exists and is a trainer
    $trainerQuery = "SELECT userid FROM user WHERE userid = ? AND role = 'trainer'";
    $trainerStmt = $conn->prepare($trainerQuery);
    $trainerStmt->bind_param("i", $trainerId);
    $trainerStmt->execute();
    $trainerResult = $trainerStmt->get_result();
    
    if ($trainerResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Trainer not found'
        ]);
        exit();
    }
    
    // Insert coaching request
    $insertQuery = "INSERT INTO coaching_requests 
                    (trainer_id, trainee_id, message, experience_level, goals, status, created_at) 
                    VALUES (?, ?, ?, ?, ?, 'pending', NOW())";
    $insertStmt = $conn->prepare($insertQuery);
    $insertStmt->bind_param("iisss", $trainerId, $userId, $message, $experienceLevel, $goals);
    
    if ($insertStmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Coaching request sent successfully',
            'requestId' => $insertStmt->insert_id
        ]);
    } else {
        throw new Exception('Failed to send coaching request');
    }

} catch (Exception $e) {
    error_log("SendCoachingRequest - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
