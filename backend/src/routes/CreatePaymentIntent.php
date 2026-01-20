<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/ProgramModel.php';
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

    // Validate required fields
    if (empty($data['programId'])) {
        throw new Exception('Program ID is required');
    }

    $programId = $data['programId'];

    // CRITICAL SECURITY: Fetch price from database, NOT from frontend
    $programModel = new ProgramModel();
    $program = $programModel->getProgramById($programId, false);

    if (!$program) {
        throw new Exception('Program not found');
    }

    if ($program['status'] !== 'published') {
        throw new Exception('This program is not available for purchase');
    }

    // Check if user already owns this program
    $purchaseModel = new PurchaseModel();
    if ($purchaseModel->hasAccess($userId, $programId)) {
        throw new Exception('You already own this program');
    }

    // Initialize Stripe
    StripeConfig::init();

    // Get the official price from database (in dollars)
    $amount = $program['price'];
    $currency = !empty($program['currency']) ? strtolower(trim($program['currency'])) : 'usd';
    
    // Validate currency
    if (empty($currency) || $currency === '0' || strlen($currency) < 3) {
        $currency = 'usd';
    }

    // Convert to cents for Stripe (required for USD, EUR, etc.)
    $amountInCents = (int)($amount * 100);

    if ($amountInCents < 50) {
        throw new Exception('Minimum purchase amount is $0.50');
    }

    // Create a pending purchase record
    $purchaseId = $purchaseModel->createPurchase($userId, $programId, $amount, $currency);

    // Create Stripe PaymentIntent with the official price
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => $currency,
        'metadata' => [
            'purchase_id' => $purchaseId,
            'program_id' => $programId,
            'trainee_id' => $userId,
            'program_title' => $program['title']
        ],
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
    ]);

    // Update purchase with Stripe payment intent ID
    $purchaseModel->updatePurchasePaymentIntent($purchaseId, $paymentIntent->id);

    // Return client secret to frontend
    echo json_encode([
        'success' => true,
        'clientSecret' => $paymentIntent->client_secret,
        'purchaseId' => $purchaseId,
        'amount' => $amount,
        'currency' => $currency
    ]);

} catch (Exception $e) {
    error_log("Error in CreatePaymentIntent.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
