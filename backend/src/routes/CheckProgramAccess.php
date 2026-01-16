<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
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
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get program ID
    $programId = $_GET['programId'] ?? null;

    if (!$programId) {
        throw new Exception('Program ID is required');
    }

    // Check if user has access
    $purchaseModel = new PurchaseModel();
    $hasAccess = $purchaseModel->hasAccess($userId, $programId);

    echo json_encode([
        'success' => true,
        'hasAccess' => $hasAccess
    ]);

} catch (Exception $e) {
    error_log("Error in CheckProgramAccess.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
