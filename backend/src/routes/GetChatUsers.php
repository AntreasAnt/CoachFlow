<?php
// Route: GetChatUsers.php
// Purpose: Fetch list of users available for chat (any authenticated user can access)
// Returns: Array of users from MySQL database (id, username, role)

// Start session first
session_start();

// Define APP_RUNNING to allow access
if (!defined('APP_RUNNING')) {
    define('APP_RUNNING', true);
}

include_once("../config/cors.php");
include_once("../config/Database.php");

// Check if user is authenticated
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Fetch all active users (excluding current user)
    $currentUserId = $_SESSION['user_id'];
    
    $query = "SELECT userid as id, username, role FROM user WHERE userid != ? AND isdeleted = 0 AND isdisabled = 0 ORDER BY username ASC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $currentUserId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => $row['id'],
            'username' => $row['username'],
            'role' => $row['role']
        ];
    }
    
    $stmt->close();
    $db->close();
    
    echo json_encode(['success' => true, 'users' => $users]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
