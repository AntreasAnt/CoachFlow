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
checkAuth(['admin', 'manager']);

try {
    
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }


    $database = new Database();
    $conn = $database->connect();
    
    // Get admin profile
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
                u.website,
                (SELECT g.image FROM gallery g WHERE g.imageid = u.imageid LIMIT 1) as profile_image
              FROM user u
              WHERE u.userid = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Admin not found');
    }

    $profile = $result->fetch_assoc();
    

    echo json_encode([
        'success' => true,
        'profile' => $profile
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
