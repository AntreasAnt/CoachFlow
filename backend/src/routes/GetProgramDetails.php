<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/ProgramModel.php';
require_once '../models/PurchaseModel.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

try {
    error_log("GetProgramDetails - Starting request");
    
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        error_log("GetProgramDetails - User not authenticated");
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get program ID from query parameter
    $programId = $_GET['programId'] ?? $_GET['id'] ?? null;
    
    if (!$programId) {
        error_log("GetProgramDetails - Program ID is required");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Program ID is required']);
        exit();
    }

    error_log("GetProgramDetails - Fetching program ID: $programId for user: $userId");

    $programModel = new ProgramModel();
    $purchaseModel = new PurchaseModel();
    
    // Check if user has purchased this program
    $hasAccess = $purchaseModel->hasAccess($userId, $programId);
    
    error_log("GetProgramDetails - User has access: " . ($hasAccess ? 'Yes' : 'No'));
    
    if (!$hasAccess) {
        error_log("GetProgramDetails - User does not have access to program $programId");
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You do not have access to this program']);
        exit();
    }

    // Get program details with sessions and exercises
    $program = $programModel->getProgramById($programId, false);
    
    if (!$program) {
        error_log("GetProgramDetails - Program not found: $programId");
        throw new Exception('Program not found');
    }

    error_log("GetProgramDetails - Successfully retrieved program with " . count($program['sessions']) . " sessions");

    echo json_encode([
        'success' => true,
        'program' => $program
    ]);

} catch (Exception $e) {
    error_log("GetProgramDetails - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
