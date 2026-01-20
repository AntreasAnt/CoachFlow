<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get total clients
    $clientsQuery = "SELECT COUNT(*) as total FROM coaching_relationships 
                     WHERE trainer_id = ? AND status = 'active'";
    $clientsStmt = $conn->prepare($clientsQuery);
    $clientsStmt->bind_param("i", $userId);
    $clientsStmt->execute();
    $clientsResult = $clientsStmt->get_result();
    $clientsData = $clientsResult->fetch_assoc();
    
    // Get active programs
    $programsQuery = "SELECT COUNT(*) as total FROM trainer_programs 
                      WHERE trainer_id = ? AND status = 'published' AND is_deleted = 0";
    $programsStmt = $conn->prepare($programsQuery);
    $programsStmt->bind_param("i", $userId);
    $programsStmt->execute();
    $programsResult = $programsStmt->get_result();
    $programsData = $programsResult->fetch_assoc();
    
    // Get monthly revenue
    $revenueQuery = "SELECT COALESCE(SUM(pp.amount), 0) as revenue
                     FROM program_purchases pp
                     JOIN trainer_programs tp ON pp.program_id = tp.id
                     WHERE tp.trainer_id = ?
                     AND pp.status = 'completed'
                     AND MONTH(pp.purchased_at) = MONTH(CURRENT_DATE())
                     AND YEAR(pp.purchased_at) = YEAR(CURRENT_DATE())";
    $revenueStmt = $conn->prepare($revenueQuery);
    $revenueStmt->bind_param("i", $userId);
    $revenueStmt->execute();
    $revenueResult = $revenueStmt->get_result();
    $revenueData = $revenueResult->fetch_assoc();
    
    // Get total sales
    $salesQuery = "SELECT COUNT(*) as total FROM program_purchases pp
                   JOIN trainer_programs tp ON pp.program_id = tp.id
                   WHERE tp.trainer_id = ? AND pp.status = 'completed'";
    $salesStmt = $conn->prepare($salesQuery);
    $salesStmt->bind_param("i", $userId);
    $salesStmt->execute();
    $salesResult = $salesStmt->get_result();
    $salesData = $salesResult->fetch_assoc();
    
    // Get pending requests
    $requestsQuery = "SELECT COUNT(*) as total FROM coaching_requests 
                      WHERE trainer_id = ? AND status = 'pending'";
    $requestsStmt = $conn->prepare($requestsQuery);
    $requestsStmt->bind_param("i", $userId);
    $requestsStmt->execute();
    $requestsResult = $requestsStmt->get_result();
    $requestsData = $requestsResult->fetch_assoc();
    
    $stats = [
        'totalClients' => (int)$clientsData['total'],
        'activePrograms' => (int)$programsData['total'],
        'monthlyRevenue' => round($revenueData['revenue'] * 0.9, 2), // After 10% platform fee
        'totalSales' => (int)$salesData['total'],
        'pendingRequests' => (int)$requestsData['total'],
        'unreadMessages' => 0 // Can be enhanced with actual message counts
    ];
    
    // Get recent activity (simplified)
    $recentActivity = [
        [
            'type' => 'sale',
            'title' => 'New Program Purchase',
            'description' => 'Advanced Strength Training purchased',
            'time' => '2 hours ago'
        ]
    ];
    
    // Get top programs
    $topProgramsQuery = "SELECT 
                           tp.title,
                           COUNT(pp.id) as sales,
                           SUM(pp.amount) as revenue
                         FROM trainer_programs tp
                         LEFT JOIN program_purchases pp ON tp.id = pp.program_id AND pp.status = 'completed'
                         WHERE tp.trainer_id = ?
                         GROUP BY tp.id
                         ORDER BY sales DESC
                         LIMIT 5";
    $topProgramsStmt = $conn->prepare($topProgramsQuery);
    $topProgramsStmt->bind_param("i", $userId);
    $topProgramsStmt->execute();
    $topProgramsResult = $topProgramsStmt->get_result();
    
    $topPrograms = [];
    while ($row = $topProgramsResult->fetch_assoc()) {
        $topPrograms[] = $row;
    }

    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'recentActivity' => $recentActivity,
        'topPrograms' => $topPrograms
    ]);

} catch (Exception $e) {
    error_log("GetTrainerDashboardStats - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
