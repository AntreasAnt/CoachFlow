<?php
// Route: UnassignProgramFromClient.php
// Purpose: Remove a program assignment from a client

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

// Check if user is a trainer
$userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
if ($userRole !== 'trainer') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$assignment_id = $input['assignment_id'] ?? null;

if (!$assignment_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Assignment ID required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Delete the assignment (verify it belongs to this trainer)
    $query = "DELETE FROM program_assignments 
              WHERE id = ? AND trainer_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $assignment_id, $trainer_id);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Program unassigned successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Assignment not found or access denied']);
    }
    
    $stmt->close();
    $db->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
