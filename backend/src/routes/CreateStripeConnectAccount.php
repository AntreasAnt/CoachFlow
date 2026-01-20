<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';
require_once '../config/StripeConfig.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    error_log("CreateStripeConnectAccount - Starting request");
    
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get user details
    $database = new Database();
    $conn = $database->connect();
    
    $query = "SELECT full_name, email, stripe_account_id FROM user WHERE userid = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        throw new Exception('User not found');
    }

    // Initialize Stripe
    \Stripe\Stripe::setApiKey(getStripeSecretKey());
    
    // Check if user already has a Stripe Connect account
    if (!empty($user['stripe_account_id'])) {
        // Create a new account link for existing account
        $accountLink = \Stripe\AccountLink::create([
            'account' => $user['stripe_account_id'],
            'refresh_url' => $_ENV['APP_URL'] . '/trainer-dashboard/payments?stripe_refresh=true',
            'return_url' => $_ENV['APP_URL'] . '/trainer-dashboard/payments?stripe_success=true',
            'type' => 'account_onboarding',
        ]);
        
        echo json_encode([
            'success' => true,
            'accountLinkUrl' => $accountLink->url,
            'accountId' => $user['stripe_account_id']
        ]);
        exit();
    }
    
    // Create new Stripe Connect account
    $account = \Stripe\Account::create([
        'type' => 'express',
        'country' => 'US',
        'email' => $user['email'],
        'capabilities' => [
            'card_payments' => ['requested' => true],
            'transfers' => ['requested' => true],
        ],
        'business_type' => 'individual',
    ]);
    
    // Save Stripe account ID to database
    $updateQuery = "UPDATE user SET stripe_account_id = ? WHERE userid = ?";
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param("si", $account->id, $userId);
    $updateStmt->execute();
    
    // Create account link for onboarding
    $accountLink = \Stripe\AccountLink::create([
        'account' => $account->id,
        'refresh_url' => $_ENV['APP_URL'] . '/trainer-dashboard/payments?stripe_refresh=true',
        'return_url' => $_ENV['APP_URL'] . '/trainer-dashboard/payments?stripe_success=true',
        'type' => 'account_onboarding',
    ]);
    
    error_log("CreateStripeConnectAccount - Account created: " . $account->id);

    echo json_encode([
        'success' => true,
        'accountLinkUrl' => $accountLink->url,
        'accountId' => $account->id
    ]);

} catch (Exception $e) {
    error_log("CreateStripeConnectAccount - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
