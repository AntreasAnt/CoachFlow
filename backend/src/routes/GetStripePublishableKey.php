<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/StripeConfig.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Optional: Check authentication if you want to restrict access
// checkAuth(['trainee', 'trainer']);

try {

    // Get publishable key
    $publishableKey = StripeConfig::getPublishableKey();

    if (empty($publishableKey)) {
        throw new Exception('Stripe publishable key not configured');
    }

    echo json_encode([
        'success' => true,
        'publishableKey' => $publishableKey
    ]);

} catch (Exception $e) {
    error_log("Error in GetStripePublishableKey.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
