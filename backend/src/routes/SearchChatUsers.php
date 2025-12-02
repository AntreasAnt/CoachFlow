<?php
/**
 * Search Chat Users
 * Returns a limited list of users matching the search query
 * Used for lazy loading in messages page
 */

session_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173, http://127.0.0.1:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only GET allowed
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Include dependencies
require_once __DIR__ . '/../config/Database.php';

try {
    // Get search query and limit
    $searchQuery = isset($_GET['q']) ? trim($_GET['q']) : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    
    // Validate limit
    if ($limit < 1 || $limit > 50) {
        $limit = 10;
    }
    
    $currentUserId = $_SESSION['user_id'];
    $db = new Database();
    $conn = $db->connect();
    
    if (empty($searchQuery)) {
        // Return empty results if no query
        $db->close();
        echo json_encode([
            'success' => true,
            'users' => []
        ]);
        exit;
    }
    
    // Search users by username (case-insensitive, partial match)
    $query = "SELECT userid as id, username, role 
              FROM user 
              WHERE userid != ? 
              AND isdeleted = 0 
              AND isdisabled = 0 
              AND username LIKE ? 
              ORDER BY username ASC 
              LIMIT ?";
    
    $stmt = $conn->prepare($query);
    $searchPattern = '%' . $searchQuery . '%';
    $stmt->bind_param('isi', $currentUserId, $searchPattern, $limit);
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
    
    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
    
} catch (Exception $e) {
    error_log('SearchChatUsers Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while searching users'
    ]);
}
