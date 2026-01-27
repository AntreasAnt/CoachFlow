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
    error_log("GetTrainerProfile - Starting request");
    
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        error_log("GetTrainerProfile - User not authenticated");
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    error_log("GetTrainerProfile - Fetching profile for user: $userId");

    $database = new Database();
    $conn = $database->connect();
    
    // Get trainer profile
    $query = "SELECT 
                u.userid,
                u.username,
                u.full_name,
                u.email,
                u.phone,
                u.bio,
                u.specializations,
                u.certifications,
                u.years_of_experience,
                u.instagram,
                u.facebook,
                u.twitter,
                u.youtube,
                u.linkedin,
                u.website
              FROM user u
              WHERE u.userid = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        error_log("GetTrainerProfile - Trainer not found: $userId");
        throw new Exception('Trainer not found');
    }

    $profile = $result->fetch_assoc();
    
    error_log("GetTrainerProfile - Successfully retrieved profile");

    echo json_encode([
        'success' => true,
        'profile' => $profile
    ]);

} catch (Exception $e) {
    error_log("GetTrainerProfile - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
