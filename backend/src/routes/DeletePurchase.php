<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/PurchaseModel.php';

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    $rawData = file_get_contents('php://input');
    error_log("DeletePurchase - Raw input: " . $rawData);
    
    $data = json_decode($rawData, true);
    error_log("DeletePurchase - Decoded data: " . print_r($data, true));

    if (empty($data['programId'])) {
        error_log("DeletePurchase - programId is empty or not set");
        throw new Exception('Program ID is required');
    }

    $programId = $data['programId'];
    error_log("DeletePurchase - Processing programId: " . $programId);

    // Hide the purchase (soft delete - don't actually delete the record)
    $purchaseModel = new PurchaseModel();
    $result = $purchaseModel->hidePurchase($userId, $programId);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Program hidden successfully'
        ]);
    } else {
        throw new Exception('Failed to hide program');
    }

} catch (Exception $e) {
    error_log("Error in DeletePurchase.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
