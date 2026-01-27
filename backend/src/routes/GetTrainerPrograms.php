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
checkAuth(['trainer']);

header('Content-Type: application/json');

try {
    $trainerId = $_SESSION['user_id'] ?? null;
    
    if (!$trainerId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();

    // Get ALL trainer's programs (both premium and client-specific)
    $query = "SELECT 
                id,
                title,
                description,
                price,
                duration_weeks,
                difficulty_level,
                category,
                created_at
              FROM premium_workout_plans
              WHERE created_by_trainer_id = ?
              ORDER BY created_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $trainerId);
    $stmt->execute();
    $result = $stmt->get_result();

    $programs = [];
    while ($row = $result->fetch_assoc()) {
        $programs[] = [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'price' => (float)$row['price'],
            'duration_weeks' => (int)$row['duration_weeks'],
            'difficulty_level' => $row['difficulty_level'],
            'category' => $row['category'],
            'created_at' => $row['created_at']
        ];
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'programs' => $programs
    ]);

} catch (Exception $e) {
    error_log("GetTrainerPrograms Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
