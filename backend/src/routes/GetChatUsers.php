<?php
// Route: GetChatUsers.php
// Purpose: Fetch list of users available for chat
// For trainers: Returns their active clients
// Returns: Array of chat users with proper structure

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
    
    $currentUserId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_privileges'] ?? $_SESSION['user_role'] ?? null;
    
    $chatUsers = [];
    
    // If user is a trainer, get their active clients
    if ($userRole === 'trainer') {
        $query = "SELECT 
                    u.userid as userId,
                    u.username as displayName,
                    u.email,
                    u.full_name,
                    u.role
                  FROM coaching_relationships cr
                  JOIN user u ON cr.trainee_id = u.userid
                  WHERE cr.trainer_id = ? 
                  AND cr.status = 'active'
                  AND u.isdeleted = 0 
                  AND u.isdisabled = 0
                  ORDER BY u.username ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $currentUserId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $chatUsers[] = [
                'userId' => (int)$row['userId'],
                'displayName' => $row['full_name'] ?: $row['displayName'],
                'email' => $row['email'],
                'role' => $row['role'],
                'unreadCount' => 0 // Can be enhanced later
            ];
        }
        
        $stmt->close();
    } elseif ($userRole === 'trainee') {
        // For trainees, get their active trainer
        $query = "SELECT 
                    u.userid as userId,
                    u.username as displayName,
                    u.email,
                    u.full_name,
                    u.role
                  FROM coaching_relationships cr
                  JOIN user u ON cr.trainer_id = u.userid
                  WHERE cr.trainee_id = ? 
                  AND cr.status = 'active'
                  AND u.isdeleted = 0 
                  AND u.isdisabled = 0
                  ORDER BY u.username ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $currentUserId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $chatUsers[] = [
                'userId' => (int)$row['userId'],
                'displayName' => $row['full_name'] ?: $row['displayName'],
                'email' => $row['email'],
                'role' => $row['role'],
                'unreadCount' => 0
            ];
        }
        
        $stmt->close();
    } else {
        // For non-trainers, get all users (existing logic)
        $query = "SELECT userid as userId, username as displayName, email, role 
                  FROM user 
                  WHERE userid != ? 
                  AND isdeleted = 0 
                  AND isdisabled = 0 
                  ORDER BY username ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param('i', $currentUserId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $chatUsers[] = [
                'userId' => (int)$row['userId'],
                'displayName' => $row['displayName'],
                'email' => $row['email'],
                'role' => $row['role'],
                'unreadCount' => 0
            ];
        }
        
        $stmt->close();
    }
    
    $db->close();
    
    echo json_encode(['success' => true, 'chatUsers' => $chatUsers]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}

