<?php
// Route: UnassignProgramFromClient.php
// Purpose: Remove a program assignment from a client

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$assignment_id = $data['assignment_id'] ?? null;

if (!$assignment_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Assignment ID required']);
    exit();
}

try {
    $trainerId = $_SESSION['user_id'] ?? null;

    $db = new Database();
    $conn = $db->connect();
    
    // Delete the assignment (verify it belongs to this trainer)
    $query = "DELETE FROM program_assignments 
              WHERE id = ? AND trainer_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $assignment_id, $trainerId);
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
?>
