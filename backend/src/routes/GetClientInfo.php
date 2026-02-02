<?php
// Route: GetClientInfo.php
// Purpose: Get detailed information about a specific client

session_start();

if (!defined('APP_RUNNING')) {
    define('APP_RUNNING', true);
}

include_once("../config/cors.php");
include_once("../config/Database.php");

// Check authentication
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Debug: Log session contents
error_log("GetClientInfo Session: " . print_r($_SESSION, true));

// Check if user is a trainer
$userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
error_log("GetClientInfo Role check: user_privileges=" . ($_SESSION['user_privileges'] ?? 'not set') . ", final userRole=" . ($userRole ?? 'null'));

if ($userRole !== 'trainer') {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'message' => 'Access denied',
        'debug_role' => $userRole,
        'debug_session_keys' => array_keys($_SESSION)
    ]);
    exit;
}

$client_id = $_GET['client_id'] ?? null;

if (!$client_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Client ID required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    error_log("GetClientInfo: Looking for relationship - trainer_id=$trainer_id, client_id=$client_id");
    
    // Verify that this client belongs to the trainer
    $query = "SELECT u.userid, u.username, u.full_name, u.email
              FROM coaching_relationships cr
              JOIN user u ON cr.trainee_id = u.userid
              WHERE cr.trainer_id = ? AND cr.trainee_id = ? AND cr.status = 'active'
              LIMIT 1";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $trainer_id, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    error_log("GetClientInfo: Query returned " . $result->num_rows . " rows");
    
    if ($result->num_rows === 0) {
        // Check if client exists at all
        $check_client = "SELECT userid, username FROM user WHERE userid = ?";
        $check_stmt = $conn->prepare($check_client);
        $check_stmt->bind_param('i', $client_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        // Check if any relationship exists
        $check_rel = "SELECT trainer_id, trainee_id, status FROM coaching_relationships WHERE trainer_id = ? AND trainee_id = ?";
        $rel_stmt = $conn->prepare($check_rel);
        $rel_stmt->bind_param('ii', $trainer_id, $client_id);
        $rel_stmt->execute();
        $rel_result = $rel_stmt->get_result();
        $rel_data = $rel_result->fetch_assoc();
        
        error_log("GetClientInfo: Client exists: " . ($check_result->num_rows > 0 ? 'yes' : 'no'));
        error_log("GetClientInfo: Relationship data: " . json_encode($rel_data));
        
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'message' => 'Client not found or not your client',
            'debug' => [
                'trainer_id' => $trainer_id,
                'client_id' => $client_id,
                'client_exists' => $check_result->num_rows > 0,
                'relationship' => $rel_data
            ]
        ]);
        exit;
    }
    
    $client = $result->fetch_assoc();
    $stmt->close();
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'client' => [
            'id' => (int)$client['userid'],
            'username' => $client['username'],
            'full_name' => $client['full_name'],
            'email' => $client['email']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("GetClientInfo Error: " . $e->getMessage());
    error_log("GetClientInfo Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
