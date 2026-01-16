<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/ProgramModel.php';

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    // Get user ID and role from session
    $userId = $_SESSION['user_id'] ?? null;
    $userRole = $_SESSION['user_privileges'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Only trainers can update their programs
    if ($userRole !== 'trainer') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied. Only trainers can update programs.']);
        exit;
    }

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($data['programId'])) {
        throw new Exception('Program ID is required');
    }

    if (empty($data['title'])) {
        throw new Exception('Program title is required');
    }

    // Update program
    $programModel = new ProgramModel();
    $result = $programModel->updateProgram($userId, $data['programId'], $data);

    echo json_encode([
        'success' => true,
        'message' => 'Program updated successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in UpdateProgram.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
