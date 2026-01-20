<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/PurchaseModel.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee']);

try {
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['programId'])) {
        throw new Exception('Program ID is required');
    }

    $programId = $data['programId'];

    // Restore the hidden purchase
    $purchaseModel = new PurchaseModel();
    $result = $purchaseModel->restorePurchase($userId, $programId);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Program restored successfully'
        ]);
    } else {
        throw new Exception('Failed to restore program');
    }

} catch (Exception $e) {
    error_log("Error in RestorePurchase.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
