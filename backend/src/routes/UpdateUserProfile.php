<?php
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
        $nameValue = htmlspecialchars(trim($inputData['full_name']), ENT_QUOTES, 'UTF-8');
        $updateData['full_name'] = empty($nameValue) ? null : $nameValue;
    }
    
    if (isset($inputData['phone'])) {
        $phoneValue = htmlspecialchars(trim($inputData['phone']), ENT_QUOTES, 'UTF-8');
        $updateData['phone'] = empty($phoneValue) ? null : $phoneValue;
    }
    
    if (isset($inputData['date_of_birth'])) {
        // Handle empty date strings by setting to NULL
        $dateValue = trim($inputData['date_of_birth']);
        $updateData['date_of_birth'] = empty($dateValue) ? null : $dateValue;
    }
    
    // Physical info
    if (isset($inputData['height'])) {
        $updateData['height'] = is_numeric($inputData['height']) ? (float)$inputData['height'] : null;
    }
    
    if (isset($inputData['weight'])) {
        $updateData['weight'] = is_numeric($inputData['weight']) ? (float)$inputData['weight'] : null;
    }
    
    if (isset($inputData['age'])) {
        $ageValue = trim($inputData['age']);
        if (empty($ageValue)) {
            $updateData['age'] = null;
        } else {
            $age = (int)$ageValue;
            $updateData['age'] = ($age >= 13 && $age <= 120) ? $age : null;
        }
    }
    
    if (isset($inputData['sex'])) {
        $validSexes = ['male', 'female', 'other', 'prefer_not_to_say'];
        $sexValue = trim($inputData['sex']);
        if (empty($sexValue)) {
            $updateData['sex'] = null;
        } elseif (in_array($sexValue, $validSexes)) {
            $updateData['sex'] = $sexValue;
        }
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
        // Keep body measurements in sync when profile weight is edited
        if (array_key_exists('weight', $updateData) && $updateData['weight'] !== null) {
            try {
                $weightValue = (float)$updateData['weight'];
                $syncStmt = $userModel->conn->prepare(
                    "INSERT INTO body_measurements (user_id, measurement_date, weight_kg)
                     VALUES (?, CURDATE(), ?)
                     ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg)"
                );

                if ($syncStmt) {
                    $syncStmt->bind_param("id", $userId, $weightValue);
                    $syncStmt->execute();
                    $syncStmt->close();
                }
            } catch (Exception $e) {
                error_log("UpdateUserProfile weight sync failed: " . $e->getMessage());
            }
        }

        // Fetch updated user data
        $updatedUser = $userModel->getprofileById($userId);

        // Prefer latest logged body measurement for response consistency
        $latestLoggedWeight = null;
        try {
            $weightStmt = $userModel->conn->prepare("SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY measurement_date DESC LIMIT 1");
            if ($weightStmt) {
                $weightStmt->bind_param("i", $userId);
                $weightStmt->execute();
                $weightResult = $weightStmt->get_result()->fetch_assoc();
                if ($weightResult && isset($weightResult['weight_kg'])) {
                    $latestLoggedWeight = (float)$weightResult['weight_kg'];
                }
                $weightStmt->close();
            }
        } catch (Exception $e) {
            error_log("UpdateUserProfile latest weight lookup failed: " . $e->getMessage());
        }
        
        // Format the response to match GetUserProfile.php format
        $responseData = [
            'userId' => $updatedUser['userid'],
            'username' => $updatedUser['username'],
            'email' => $updatedUser['email'],
            'full_name' => $updatedUser['full_name'] ?: $updatedUser['username'],
            'phone' => $updatedUser['phone'],
            'date_of_birth' => $updatedUser['date_of_birth'],
            'role' => $updatedUser['role'],
            'profilePicture' => $updatedUser['image'] ?? null,
            
            // Physical info
            'height' => $updatedUser['height'],
            'weight' => $latestLoggedWeight !== null ? $latestLoggedWeight : $updatedUser['weight'],
            'age' => $updatedUser['age'],
            'sex' => $updatedUser['sex'],
            
            // Professional info (for trainers)
            'specialization' => $updatedUser['specialization'],
            'experience_years' => $updatedUser['experience_years'],
            'certifications' => $updatedUser['certifications'],
            'bio' => $updatedUser['bio'],
            
            // Fitness info (for trainees)
            'fitness_goals' => $updatedUser['fitness_goals'],
            'experience_level' => $updatedUser['experience_level'],
            'medical_notes' => $updatedUser['medical_notes'],
        ];
        
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $responseData
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
