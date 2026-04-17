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

    // Pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Search
    $search = !empty($_GET['search']) ? '%' . $_GET['search'] . '%' : null;
    
    // Filters
    $client_id = !empty($_GET['client_id']) ? (int)$_GET['client_id'] : null;
    $assignment_filter = !empty($_GET['assignment_filter']) ? $_GET['assignment_filter'] : 'all'; // all, assigned, unassigned

    $baseQuery = " FROM premium_workout_plans pwp";
    
    if ($client_id && $assignment_filter === 'assigned') {
        $baseQuery .= " INNER JOIN program_assignments pa ON pwp.id = pa.program_id AND pa.trainee_id = ? AND pa.trainer_id = ?";
    } else if ($client_id && $assignment_filter === 'unassigned') {
        $baseQuery .= " LEFT JOIN program_assignments pa ON pwp.id = pa.program_id AND pa.trainee_id = ? AND pa.trainer_id = ?";
    }

    $baseQuery .= " WHERE pwp.created_by_trainer_id = ? AND pwp.is_active = 1";
    
    if ($client_id && $assignment_filter === 'unassigned') {
        $baseQuery .= " AND pa.id IS NULL";
    }
    
    if ($search) {
        $baseQuery .= " AND (pwp.title LIKE ? OR pwp.description LIKE ?)";
    }
    
    $countQuery = "SELECT COUNT(DISTINCT pwp.id) as total" . $baseQuery;
    $dataQuery = "SELECT DISTINCT pwp.id, pwp.title, pwp.description, pwp.price, pwp.duration_weeks, pwp.difficulty_level, pwp.category, pwp.created_at" . $baseQuery . " ORDER BY pwp.created_at DESC LIMIT ? OFFSET ?";

    // Prepare parameters
    $countParams = [];
    $countTypes = "";
    
    if ($client_id && ($assignment_filter === 'assigned' || $assignment_filter === 'unassigned')) {
        $countParams[] = $client_id;
        $countParams[] = $trainerId;
        $countTypes .= "ii";
    }
    
    $countParams[] = $trainerId;
    $countTypes .= "i";
    
    if ($search) {
        $countParams[] = $search;
        $countParams[] = $search;
        $countTypes .= "ss";
    }
    
    $dataParams = $countParams;
    $dataTypes = $countTypes;
    
    $dataParams[] = $limit;
    $dataParams[] = $offset;
    $dataTypes .= "ii";
    
    // Execute Count
    $countStmt = $conn->prepare($countQuery);
    if (!empty($countParams)) {
        $countStmt->bind_param($countTypes, ...$countParams);
    }
    $countStmt->execute();
    $totalRecords = $countStmt->get_result()->fetch_assoc()['total'] ?? 0;
    $countStmt->close();

    // Execute Data
    $dataStmt = $conn->prepare($dataQuery);
    if (!empty($dataParams)) {
        $dataStmt->bind_param($dataTypes, ...$dataParams);
    }
    $dataStmt->execute();
    $result = $dataStmt->get_result();

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

    $dataStmt->close();

    echo json_encode([
        'success' => true,
        'programs' => $programs,
        'pagination' => [
            'total' => (int)$totalRecords,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($totalRecords / $limit)
        ]
    ]);

} catch (Exception $e) {
    error_log("GetTrainerPrograms Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
