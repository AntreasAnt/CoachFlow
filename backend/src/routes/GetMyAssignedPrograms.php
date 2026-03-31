<?php
// Route: GetMyAssignedPrograms.php
// Purpose: Allow trainee to view their trainer-assigned workout programs

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication - allow both trainees and trainers
checkAuth(['trainee', 'trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    $userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? 'trainee';
    
    if ($userRole === 'trainer') {
        // Trainer viewing assigned programs (maybe for debugging)
        $target_user_id = $_GET['trainee_id'] ?? $userId;
        
        // Verify relationship if looking at a specific trainee
        if ($target_user_id !== $userId) {
            $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                           WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'";
            $stmt = $conn->prepare($verify_query);
            $stmt->bind_param('ii', $userId, $target_user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            if ($row['count'] == 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Access denied']);
                exit();
            }
        }
    } else {
        // Trainee viewing their own assigned programs
        $target_user_id = $userId;
    }
    
    // Optional pagination (backwards compatible: omit page/limit => full list)
    $pageParam = $_GET['page'] ?? null;
    $limitParam = $_GET['limit'] ?? null;
    $page = null;
    $limit = null;
    $offset = null;

    if ($pageParam !== null || $limitParam !== null) {
        $page = $pageParam !== null ? max(1, (int)$pageParam) : 1;
        $limit = $limitParam !== null ? max(1, min(50, (int)$limitParam)) : 10;
        $offset = ($page - 1) * $limit;
    }

    // Get assigned workout programs with trainer info.
    // IMPORTANT: For trainees, only return assignments from an ACTIVE coaching relationship.
    $joinActiveRelationship = "";
    if ($userRole !== 'trainer') {
        $joinActiveRelationship = " JOIN coaching_relationships cr 
                                   ON cr.trainer_id = pa.trainer_id 
                                  AND cr.trainee_id = pa.trainee_id 
                                  AND cr.status = 'active'";
    }

    // Count total for pagination
    $total = null;
    if ($page !== null && $limit !== null) {
        $countQuery = "SELECT COUNT(*) as total
                       FROM program_assignments pa
                       JOIN premium_workout_plans p ON pa.program_id = p.id
                       LEFT JOIN user u ON pa.trainer_id = u.userid
                       $joinActiveRelationship
                       WHERE pa.trainee_id = ?";

        $countStmt = $conn->prepare($countQuery);
        $countStmt->bind_param('i', $target_user_id);
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $countRow = $countResult->fetch_assoc();
        $total = (int)($countRow['total'] ?? 0);
        $countStmt->close();
    }

    $query = "SELECT pa.id as assignment_id, 
                     pa.assigned_at,
                     p.id,
                     p.title,
                     p.description,
                     p.category,
                     p.difficulty_level,
                     p.duration_weeks,
                     p.price,
                     p.created_by_trainer_id,
                     u.username as trainer_name,
                     DATE_FORMAT(pa.assigned_at, '%Y-%m-%d %H:%i') as assigned_at_formatted
              FROM program_assignments pa
              JOIN premium_workout_plans p ON pa.program_id = p.id
              LEFT JOIN user u ON pa.trainer_id = u.userid
              $joinActiveRelationship
              WHERE pa.trainee_id = ?
              ORDER BY pa.assigned_at DESC";

    if ($page !== null && $limit !== null) {
        $query .= " LIMIT ? OFFSET ?";
    }
    
    $stmt = $conn->prepare($query);
    if ($page !== null && $limit !== null) {
        $stmt->bind_param('iii', $target_user_id, $limit, $offset);
    } else {
        $stmt->bind_param('i', $target_user_id);
    }
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
            'assigned_at' => $row['assigned_at'],
            'assigned_at_formatted' => $row['assigned_at_formatted'],
            'trainer_id' => (int)$row['created_by_trainer_id'],
            'trainer_name' => $row['trainer_name']
        ];
    }
    
    $payload = [
        'success' => true,
        'programs' => $programs,
        'count' => count($programs)
    ];

    if ($page !== null && $limit !== null) {
        $totalPages = (int)ceil($total / $limit);
        $payload['pagination'] = [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages
        ];
    }

    echo json_encode($payload);

} catch (Exception $e) {
    error_log("GetMyAssignedPrograms - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'error' => $e->getMessage()
    ]);
}
?>