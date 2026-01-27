<?php
require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

header('Content-Type: application/json');

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();

    // Get all exercises including custom ones created by the user
    $query = "SELECT 
                id,
                name,
                category,
                muscle_group,
                equipment,
                instructions,
                created_by_user_id,
                is_custom
              FROM exercises
              WHERE is_custom = 0 OR created_by_user_id = ?
              ORDER BY name ASC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $exercises = [];
    while ($row = $result->fetch_assoc()) {
        $exercises[] = $row;
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'exercises' => $exercises
    ]);

} catch (Exception $e) {
    error_log("GetExercises Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
