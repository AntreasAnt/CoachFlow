<?php
// Route: GetClientAssignedPrograms.php
// Purpose: Get all programs assigned to a specific client

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
    
    // Verify that this client belongs to the trainer
    $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                     WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
    $stmt = $conn->prepare($verify_query);
    $stmt->bind_param('ii', $trainer_id, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['count'] == 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    $stmt->close();
    
    // Get assigned programs
    $query = "SELECT pa.id as assignment_id, pa.assigned_at, 
                     p.id, p.title, p.description, p.category, p.difficulty_level, p.duration_weeks, p.price
              FROM program_assignments pa
              JOIN premium_workout_plans p ON pa.program_id = p.id
              WHERE pa.trainee_id = ? AND pa.trainer_id = ?
              ORDER BY pa.assigned_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $client_id, $trainer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $programs = [];
    while ($row = $result->fetch_assoc()) {
        $programs[] = [
            'assignment_id' => (int)$row['assignment_id'],
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'category' => $row['category'],
            'difficulty_level' => $row['difficulty_level'],
            'duration_weeks' => (int)$row['duration_weeks'],
            'price' => (float)$row['price'],
            'assigned_at' => $row['assigned_at']
        ];
    }
    
    $stmt->close();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'programs' => $programs
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
