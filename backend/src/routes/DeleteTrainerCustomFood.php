<?php
// Route: DeleteTrainerCustomFood.php
// Purpose: Delete a trainer's custom food

session_start();

if (!defined('APP_RUNNING')) {
    define('APP_RUNNING', true);
}

include_once("../config/cors.php");
include_once("../config/Database.php");

// Only allow DELETE/POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

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
$food_id = $input['food_id'] ?? null;

if (!$food_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Food ID required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Delete only if owned by this trainer
    $query = "DELETE FROM trainer_custom_foods 
              WHERE id = ? AND trainer_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $food_id, $trainer_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Custom food deleted successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Food not found or not authorized'
            ]);
        }
    } else {
        throw new Exception('Failed to delete custom food');
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("DeleteTrainerCustomFood Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
