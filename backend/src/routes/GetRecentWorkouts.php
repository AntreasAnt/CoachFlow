<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../controllers/WorkoutController.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $pageSize = isset($_GET['pageSize']) ? max(1, intval($_GET['pageSize'])) : 7;
    $offset = ($page - 1) * $pageSize;

    // Directly use WorkoutModel to allow paging
    require_once '../models/WorkoutModel.php';
    $model = new WorkoutModel();
    $sessions = $model->getRecentSessionsPaged($userId, $pageSize, $offset);
    $hasMore = count($sessions) === $pageSize; // optimistic; for exact total a COUNT query could be added

    echo json_encode([
        'success' => true,
        'sessions' => $sessions,
        'page' => $page,
        'pageSize' => $pageSize,
        'hasMore' => $hasMore
    ]);

} catch (Exception $e) {
    error_log("Error in GetRecentWorkouts: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
