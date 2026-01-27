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

// Check authentication - only trainees can check their requests
checkAuth(['trainee']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get trainee's coaching requests with trainer details
    $query = "SELECT 
                cr.id,
                cr.trainer_id,
                cr.message,
                cr.experience_level,
                cr.goals,
                cr.status,
                cr.created_at,
                cr.processed_at,
                u.full_name as trainer_name,
                u.email as trainer_email,
                u.username as trainer_username,
                tp.bio as trainer_bio,
                tp.specializations,
                tp.hourly_rate,
                tp.average_rating,
                tp.profile_image
              FROM coaching_requests cr
              JOIN user u ON cr.trainer_id = u.userid
              LEFT JOIN trainer_profiles tp ON cr.trainer_id = tp.user_id
              WHERE cr.trainee_id = ?
              ORDER BY 
                CASE 
                  WHEN cr.status = 'pending' THEN 1
                  WHEN cr.status = 'accepted' THEN 2
                  WHEN cr.status = 'declined' THEN 3
                END,
                cr.created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        // Parse specializations if it's a JSON string
        if (!empty($row['specializations'])) {
            $specs = json_decode($row['specializations'], true);
            $row['specializations'] = is_array($specs) ? $specs : [$row['specializations']];
        } else {
            $row['specializations'] = [];
        }
        
        $requests[] = $row;
    }

    echo json_encode([
        'success' => true,
        'requests' => $requests
    ]);

} catch (Exception $e) {
    error_log("GetTraineeCoachingRequests - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
