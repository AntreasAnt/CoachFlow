<?php
// Route: GetChatUsers.php
// Purpose: Fetch list of users available for chat
// For trainers: Returns their active clients
// Returns: Array of chat users with proper structure

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Must be authenticated (guest cannot access chat user map)
checkAuth(['trainee', 'trainer', 'admin', 'manager']);

try {
    $db = new Database();
    $conn = $db->connect();
    
    $chatUsers = [];
    
    // Fetch all users systematically to resolve names in conversations globally
    // since this endpoint is only used by ChatProvider for `userMap` (ID -> Name resolution)
    // and not for showing a scrollable list of people to message.
    $query = "SELECT userid as userId, username as displayName, full_name
              FROM user 
              WHERE isdeleted = 0 
              AND isdisabled = 0 
              ORDER BY username ASC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $chatUsers[] = [
            'userId' => (int)$row['userId'],
            'displayName' => !empty($row['full_name']) ? $row['full_name'] : $row['displayName'],
            'username' => $row['displayName'], // The SQL query aliases 'username' as 'displayName'. So this holds the actual handle.
            'unreadCount' => 0
        ];
    }
    
    $stmt->close();
    
    $db->close();
    
    echo json_encode(['success' => true, 'chatUsers' => $chatUsers]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
