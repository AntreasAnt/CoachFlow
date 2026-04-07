<?php
define('APP_RUNNING', true);
require_once '../bootstrap.php';
require_once '../models/AnalyticsModel.php';
require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    checkAuth(['trainee', 'trainer', 'admin']);
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) throw new Exception('Authentication required');

    $db = new Database();
    $conn = $db->connect();

    $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-90 days'));
    $endDate = $_GET['end_date'] ?? date('Y-m-d');
    
    // Check if the route is for a specific trainee by a trainer
    if (isset($_GET['trainee_id'])) {
        checkAuth(['trainer']);
        $traineeId = intval($_GET['trainee_id']);
        
        $verifyQuery = "SELECT COUNT(*) as count FROM coaching_relationships 
                        WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
        $stmt = $conn->prepare($verifyQuery);
        $stmt->bind_param("ii", $userId, $traineeId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if ($row['count'] == 0) {
            throw new Exception('You do not have permission to view this trainee\'s analytics');
        }
        $userId = $traineeId; // override the target user id
    }
    
    $filter = isset($_GET['filter']) ? trim($_GET['filter']) : '';
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 4;
    $offset = ($page - 1) * $limit;

    // First get unique exercises with filter
    $countQuery = "SELECT COUNT(DISTINCT exercise_name) as total FROM exercise_1rm_tracking WHERE user_id = ? AND recorded_date BETWEEN ? AND ?";
    if ($filter) {
        $countQuery .= " AND exercise_name LIKE ?";
    }
    
    $stmt = $conn->prepare($countQuery);
    if ($filter) {
        $searchTerm = "%$filter%";
        $stmt->bind_param("isss", $userId, $startDate, $endDate, $searchTerm);
    } else {
        $stmt->bind_param("iss", $userId, $startDate, $endDate);
    }
    $stmt->execute();
    $totalResult = $stmt->get_result()->fetch_assoc();
    $totalExercises = $totalResult['total'] ?? 0;

    // Get paginated exercises
    $exerciseQuery = "SELECT DISTINCT exercise_name FROM exercise_1rm_tracking WHERE user_id = ? AND recorded_date BETWEEN ? AND ?";
    if ($filter) {
        $exerciseQuery .= " AND exercise_name LIKE ?";
    }
    $exerciseQuery .= " ORDER BY exercise_name ASC LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($exerciseQuery);
    if ($filter) {
        $stmt->bind_param("isssii", $userId, $startDate, $endDate, $searchTerm, $limit, $offset);
    } else {
        $stmt->bind_param("issii", $userId, $startDate, $endDate, $limit, $offset);
    }
    $stmt->execute();
    $exResult = $stmt->get_result();
    
    $exercises = [];
    while ($row = $exResult->fetch_assoc()) {
        $exercises[] = $row['exercise_name'];
    }

    $progress = [];
    if (!empty($exercises)) {
        $placeholders = implode(',', array_fill(0, count($exercises), '?'));
        $dataQuery = "SELECT exercise_name, recorded_date, estimated_1rm, based_on_weight, based_on_reps, calculation_method
                      FROM exercise_1rm_tracking
                      WHERE user_id = ? AND recorded_date BETWEEN ? AND ? AND exercise_name IN ($placeholders)
                      ORDER BY exercise_name, recorded_date ASC";
        
        $stmt = $conn->prepare($dataQuery);
        $types = "iss" . str_repeat("s", count($exercises));
        $params = [$userId, $startDate, $endDate, ...$exercises];
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $dataResult = $stmt->get_result();
        
        while ($row = $dataResult->fetch_assoc()) {
            $ex = $row['exercise_name'];
            if (!isset($progress[$ex])) $progress[$ex] = [];
            $progress[$ex][] = $row;
        }
    }

    echo json_encode([
        'success' => true,
        'strength_progress' => $progress,
        'pagination' => [
            'total' => $totalExercises,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($totalExercises / $limit)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}