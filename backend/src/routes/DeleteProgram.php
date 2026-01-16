<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/ProgramModel.php';

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

    // Only trainers can delete their programs
    if ($userRole !== 'trainer') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied. Only trainers can delete programs.']);
        exit;
    }

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields - accept both 'id' and 'programId'
    $programId = $data['programId'] ?? $data['id'] ?? null;
    
    if (empty($programId)) {
        throw new Exception('Program ID is required');
    }

    // Delete program
    $programModel = new ProgramModel();
    $result = $programModel->deleteProgram($userId, $programId);

    echo json_encode([
        'success' => true,
        'message' => 'Program deleted successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in DeleteProgram.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
