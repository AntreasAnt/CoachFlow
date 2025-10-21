<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../models/UserModel.php");
include_once("../config/Auth.php");

checkAuth(['trainee', 'trainer', 'admin']);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST method allowed'
    ]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

$inputData = json_decode(file_get_contents("php://input"), true);

if (!$inputData) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON data'
    ]);
    exit;
}

$userModel = new UserModel();
$userId = $_SESSION['user_id'];

try {
    // Validate and sanitize input data
    $updateData = [];
    
    // Basic info fields
    if (isset($inputData['full_name'])) {
        $updateData['full_name'] = htmlspecialchars(trim($inputData['full_name']), ENT_QUOTES, 'UTF-8');
    }
    
    if (isset($inputData['phone'])) {
        $updateData['phone'] = htmlspecialchars(trim($inputData['phone']), ENT_QUOTES, 'UTF-8');
    }
    
    if (isset($inputData['date_of_birth'])) {
        $updateData['date_of_birth'] = $inputData['date_of_birth'];
    }
    
    // Physical info
    if (isset($inputData['height'])) {
        $updateData['height'] = is_numeric($inputData['height']) ? (float)$inputData['height'] : null;
    }
    
    if (isset($inputData['weight'])) {
        $updateData['weight'] = is_numeric($inputData['weight']) ? (float)$inputData['weight'] : null;
    }
    
    // Professional info (for trainers)
    if (isset($inputData['specialization'])) {
        $updateData['specialization'] = htmlspecialchars(trim($inputData['specialization']), ENT_QUOTES, 'UTF-8');
    }
    
    if (isset($inputData['experience_years'])) {
        $updateData['experience_years'] = is_numeric($inputData['experience_years']) ? (int)$inputData['experience_years'] : null;
    }
    
    if (isset($inputData['certifications'])) {
        $updateData['certifications'] = htmlspecialchars(trim($inputData['certifications']), ENT_QUOTES, 'UTF-8');
    }
    
    if (isset($inputData['bio'])) {
        $updateData['bio'] = htmlspecialchars(trim($inputData['bio']), ENT_QUOTES, 'UTF-8');
    }
    
    // Fitness info (for trainees)
    if (isset($inputData['fitness_goals'])) {
        $updateData['fitness_goals'] = htmlspecialchars(trim($inputData['fitness_goals']), ENT_QUOTES, 'UTF-8');
    }
    
    if (isset($inputData['experience_level'])) {
        $validLevels = ['Beginner', 'Intermediate', 'Advanced'];
        if (in_array($inputData['experience_level'], $validLevels)) {
            $updateData['experience_level'] = $inputData['experience_level'];
        }
    }
    
    if (isset($inputData['medical_notes'])) {
        $updateData['medical_notes'] = htmlspecialchars(trim($inputData['medical_notes']), ENT_QUOTES, 'UTF-8');
    }

    // Update the user profile
    if ($userModel->updateUserProfile($userId, $updateData)) {
        // Fetch updated user data
        $updatedUser = $userModel->getprofileById($userId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $updatedUser
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update profile'
        ]);
    }

} catch (Exception $e) {
    error_log("UpdateUserProfile error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>
