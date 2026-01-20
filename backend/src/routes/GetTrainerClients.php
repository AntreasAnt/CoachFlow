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

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get active coaching relationships
    $query = "SELECT 
                cr.id,
                cr.trainee_id,
                cr.started_at,
                cr.status,
                u.full_name as name,
                u.email,
                u.phone,
                (SELECT COUNT(*) FROM trainer_program_assignments tpa 
                 WHERE tpa.trainee_id = cr.trainee_id AND tpa.trainer_id = cr.trainer_id) as assigned_programs
              FROM coaching_relationships cr
              JOIN user u ON cr.trainee_id = u.userid
              WHERE cr.trainer_id = ?
              AND cr.status = 'active'
              ORDER BY cr.started_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $row['last_active'] = 'Today'; // Simplified - can be enhanced
        $clients[] = $row;
    }

    echo json_encode([
        'success' => true,
        'clients' => $clients
    ]);

} catch (Exception $e) {
    error_log("GetTrainerClients - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
