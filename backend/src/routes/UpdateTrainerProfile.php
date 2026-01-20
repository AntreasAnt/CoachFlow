<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    error_log("UpdateTrainerProfile - Starting request");
    
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        error_log("UpdateTrainerProfile - User not authenticated");
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        exit();
    }

    error_log("UpdateTrainerProfile - Updating profile for user: $userId");

    $database = new Database();
    $conn = $database->connect();
    
    // Update trainer profile
    $query = "UPDATE user SET
                full_name = ?,
                phone = ?,
                bio = ?,
                specializations = ?,
                certifications = ?,
                years_of_experience = ?,
                instagram = ?,
                facebook = ?,
                twitter = ?,
                youtube = ?,
                linkedin = ?,
                website = ?
              WHERE userid = ?";
    
    $stmt = $conn->prepare($query);
    
    $fullName = $input['fullName'] ?? '';
    $phone = $input['phone'] ?? '';
    $bio = $input['bio'] ?? '';
    $specializations = $input['specializations'] ?? '[]';
    $certifications = $input['certifications'] ?? '';
    $yearsOfExperience = $input['yearsOfExperience'] ?? null;
    $instagram = $input['instagram'] ?? '';
    $facebook = $input['facebook'] ?? '';
    $twitter = $input['twitter'] ?? '';
    $youtube = $input['youtube'] ?? '';
    $linkedin = $input['linkedin'] ?? '';
    $website = $input['website'] ?? '';
    
    $stmt->bind_param(
        "ssssssssssssi",
        $fullName,
        $phone,
        $bio,
        $specializations,
        $certifications,
        $yearsOfExperience,
        $instagram,
        $facebook,
        $twitter,
        $youtube,
        $linkedin,
        $website,
        $userId
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update profile: " . $stmt->error);
    }
    
    error_log("UpdateTrainerProfile - Profile updated successfully");

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);

} catch (Exception $e) {
    error_log("UpdateTrainerProfile - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
