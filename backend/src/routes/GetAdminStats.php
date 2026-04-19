<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication - only admins can access this
checkAuth(['admin']);

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Get total users count
    $totalUsersQuery = "SELECT COUNT(*) as count FROM user";
    $stmt = $conn->prepare($totalUsersQuery);
    $stmt->execute();
    $result = $stmt->get_result();
    $totalUsers = $result->fetch_assoc()['count'];
    $stmt->close();
    
    // Get total trainers count
    $trainersQuery = "SELECT COUNT(*) as count FROM user WHERE role = 'trainer'";
    $stmt = $conn->prepare($trainersQuery);
    $stmt->execute();
    $result = $stmt->get_result();
    $totalTrainers = $result->fetch_assoc()['count'];
    $stmt->close();
    
    // Get total trainees count
    $traineesQuery = "SELECT COUNT(*) as count FROM user WHERE role = 'trainee'";
    $stmt = $conn->prepare($traineesQuery);
    $stmt->execute();
    $result = $stmt->get_result();
    $totalTrainees = $result->fetch_assoc()['count'];
    $stmt->close();
    
    // For active users, check lastlogin within last 30 days
    $activeUsers = 0;
    try {
        $activeUsersQuery = "SELECT COUNT(*) as count FROM user 
                            WHERE lastlogin >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $stmt = $conn->prepare($activeUsersQuery);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $activeUsers = $row ? $row['count'] : 0;
        $stmt->close();
    } catch (mysqli_sql_exception $e) {
        $activeUsers = 0; // if it fails, fallback to 0 instead of total users so it's not fake
    }
    
    // Return the stats
    echo json_encode([
        'success' => true,
        'stats' => [
            'totalUsers' => (int)$totalUsers,
            'totalTrainers' => (int)$totalTrainers,
            'totalTrainees' => (int)$totalTrainees,
            'activeUsers' => (int)$activeUsers
        ]
    ]);
    
} catch (mysqli_sql_exception $e) {
    error_log("Database error in GetAdminStats: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} catch (Exception $e) {
    error_log("General error in GetAdminStats: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
