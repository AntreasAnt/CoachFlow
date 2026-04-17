<?php
require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow POST requests (Delete doesn't always have body so POST is fine/standard for APIs without strictly RESTful DELETE mapping)
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

header('Content-Type: application/json');

try {
    $trainerId = $_SESSION['user_id'] ?? null;
    if (!$trainerId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $program_id = $input['program_id'] ?? $_GET['program_id'] ?? null;

    if (!$program_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Program ID required']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();

    // Soft delete by setting is_active = 0
    $query = "UPDATE premium_workout_plans 
              SET is_active = 0 
              WHERE id = ? AND created_by_trainer_id = ?";
              
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $program_id, $trainerId);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Program deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Program not found or no permission to delete']);
    }
    
    $stmt->close();
} catch (Exception $e) {
    error_log("DeleteTrainerProgram Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
