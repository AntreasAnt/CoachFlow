<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';
require_once '../models/PurchaseModel.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    error_log("GetTrainerEarnings - Starting request");
    
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    error_log("GetTrainerEarnings - Fetching earnings for trainer: $userId");

    $database = new Database();
    $conn = $database->connect();
    
    // Get total earnings from program sales
    $query = "SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(pp.amount), 0) as total_earnings,
                COALESCE(SUM(CASE WHEN MONTH(pp.purchased_at) = MONTH(CURRENT_DATE()) 
                    AND YEAR(pp.purchased_at) = YEAR(CURRENT_DATE()) 
                    THEN pp.amount ELSE 0 END), 0) as this_month_earnings
              FROM program_purchases pp
              JOIN trainer_programs tp ON pp.program_id = tp.id
              WHERE tp.trainer_id = ?
              AND pp.status = 'completed'
              AND pp.access_granted = 1";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $earningsData = $result->fetch_assoc();
    
    // Platform takes 10% fee
    $platformFee = 0.10;
    $totalEarnings = $earningsData['total_earnings'] * (1 - $platformFee);
    $thisMonthEarnings = $earningsData['this_month_earnings'] * (1 - $platformFee);
    
    // Check if Stripe is connected
    $stripeQuery = "SELECT stripe_account_id FROM user WHERE userid = ?";
    $stripeStmt = $conn->prepare($stripeQuery);
    $stripeStmt->bind_param("i", $userId);
    $stripeStmt->execute();
    $stripeResult = $stripeStmt->get_result();
    $stripeData = $stripeResult->fetch_assoc();
    
    $stripeConnected = !empty($stripeData['stripe_account_id']);
    
    $earnings = [
        'total' => round($totalEarnings, 2),
        'thisMonth' => round($thisMonthEarnings, 2),
        'available' => round($totalEarnings * 0.7, 2), // Simplified: 70% available
        'pending' => round($totalEarnings * 0.3, 2), // Simplified: 30% pending
        'totalSales' => (int)$earningsData['total_sales']
    ];
    
    error_log("GetTrainerEarnings - Successfully retrieved earnings");

    echo json_encode([
        'success' => true,
        'earnings' => $earnings,
        'stripeConnected' => $stripeConnected,
        'stripeAccountId' => $stripeData['stripe_account_id'] ?? null
    ]);

} catch (Exception $e) {
    error_log("GetTrainerEarnings - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
