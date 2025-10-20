<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../models/UserModel.php");
include_once("../config/Auth.php");
// Allow all authenticated users to access profiles
checkAuth(['admin', 'manager', 'trainer', 'trainee']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

$userModel = new UserModel();
$currentUserId = $_SESSION['user_id'];

// Check if requesting a specific user's profile via username parameter
$requestedUsername = isset($_GET['username']) ? $_GET['username'] : null;
$targetUserId = $currentUserId; // Default to current user

if ($requestedUsername) {
    // Get user ID by username
    $targetUser = $userModel->getUserByUsername($requestedUsername);
    if ($targetUser) {
        $targetUserId = $targetUser['userid'];
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        exit;
    }
}

$user = $userModel->getprofileById($targetUserId);

if ($user) {
    // Calculate member since date
    $memberSince = $user['registrationdate'] ? 
        date('Y-m-d', $user['registrationdate']) : 
        '2024-01-01';

    // Format the response data with all available profile fields
    $responseData = [
        'userId' => $user['userid'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'] ?: $user['username'],
        'phone' => $user['phone'],
        'date_of_birth' => $user['date_of_birth'],
        'role' => $user['role'],
        'profilePicture' => $user['image'],
        
        // Physical info
        'height' => $user['height'],
        'weight' => $user['weight'],
        
        // Professional info (for trainers)
        'specialization' => $user['specialization'],
        'experience_years' => $user['experience_years'],
        'certifications' => $user['certifications'],
        'bio' => $user['bio'],
        
        // Fitness info (for trainees)
        'fitness_goals' => $user['fitness_goals'],
        'experience_level' => $user['experience_level'],
        'medical_notes' => $user['medical_notes'],
        
        // Metadata
        'member_since' => $memberSince,
        'isOwnProfile' => ($targetUserId == $currentUserId)
    ];

    echo json_encode([
        'success' => true,
        'user' => $responseData
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'User not found'
    ]);
}
