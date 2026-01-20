<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/PurchaseModel.php';
require_once '../config/StripeConfig.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['paymentIntentId'])) {
        throw new Exception('Payment Intent ID is required');
    }

    $paymentIntentId = $data['paymentIntentId'];

    // Initialize Stripe
    StripeConfig::init();

    // Retrieve the payment intent from Stripe to verify it's paid
    $paymentIntent = \Stripe\PaymentIntent::retrieve($paymentIntentId);

    if ($paymentIntent->status !== 'succeeded') {
        throw new Exception('Payment has not been completed');
    }

    // Complete the purchase in our database
    $purchaseModel = new PurchaseModel();
    $purchaseModel->completePurchase($paymentIntentId, $paymentIntent->payment_method);

    echo json_encode([
        'success' => true,
        'message' => 'Purchase completed successfully'
    ]);

} catch (Exception $e) {
    error_log("Error in CompletePurchase.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
