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

    $conn->begin_transaction();
    
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
    
    $specArray = json_decode($specializations, true);
    if (is_array($specArray) && count($specArray) > 3) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Maximum of 3 specializations allowed']);
        exit();
    }
    
    $certifications = $input['certifications'] ?? '';
    $certificationsForTrainerProfiles = '[]';
    try {
        $certTrim = is_string($certifications) ? trim($certifications) : '';
        if ($certTrim === '') {
            $certificationsForTrainerProfiles = '[]';
        } else {
            $decoded = json_decode($certTrim, true);
            if (is_array($decoded)) {
                $certificationsForTrainerProfiles = $certTrim;
            } else {
                $parts = preg_split('/[\n,]+/', $certTrim);
                $parts = array_values(array_filter(array_map('trim', $parts), function ($v) {
                    return $v !== '';
                }));
                $certificationsForTrainerProfiles = json_encode($parts, JSON_UNESCAPED_UNICODE);
            }
        }
    } catch (Exception $e) {
        $certificationsForTrainerProfiles = '[]';
    }
    $yearsOfExperience = $input['yearsOfExperience'] ?? 0;
    // Convert empty string to 0 for integer field
    if ($yearsOfExperience === '' || $yearsOfExperience === null) {
        $yearsOfExperience = 0;
    }
    $instagram = $input['instagram'] ?? '';
    $facebook = $input['facebook'] ?? '';
    $twitter = $input['twitter'] ?? '';
    $youtube = $input['youtube'] ?? '';
    $linkedin = $input['linkedin'] ?? '';
    $website = $input['website'] ?? '';
    $profileImageProvided = array_key_exists('profileImage', $input);
    $profileImage = $profileImageProvided ? ($input['profileImage'] ?? '') : '';
    
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

    // Keep trainer_profiles in sync for trainee browsing/search.
    // trainer_profiles is the source of truth for GetAvailableTrainers.
    $syncQuery = "INSERT INTO trainer_profiles (user_id, bio, specializations, certifications, experience_years)
                  VALUES (?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    bio = VALUES(bio),
                    specializations = VALUES(specializations),
                    certifications = VALUES(certifications),
                    experience_years = VALUES(experience_years)";
    $syncStmt = $conn->prepare($syncQuery);
    if (!$syncStmt) {
        throw new Exception("Failed to prepare trainer_profiles sync: " . $conn->error);
    }

    $yearsOfExperienceInt = (int) $yearsOfExperience;
    $syncStmt->bind_param(
        "isssi",
        $userId,
        $bio,
        $specializations,
        $certificationsForTrainerProfiles,
        $yearsOfExperienceInt
    );
    if (!$syncStmt->execute()) {
        throw new Exception("Failed to sync trainer_profiles: " . $syncStmt->error);
    }

    // Upsert trainer profile image in trainer_profiles.
    // Only update if the client explicitly sent profileImage.
    // Guard against oversized values (e.g., data URI/base64 gallery fallback).
    if ($profileImageProvided) {
        $shouldStore = is_string($profileImage)
            && $profileImage !== ''
            && strlen($profileImage) <= 240
            && substr($profileImage, 0, 5) !== 'data:';

        if ($shouldStore) {
            $imageQuery = "INSERT INTO trainer_profiles (user_id, profile_image)
                           VALUES (?, ?)
                           ON DUPLICATE KEY UPDATE profile_image = VALUES(profile_image)";
            $imageStmt = $conn->prepare($imageQuery);
            if (!$imageStmt) {
                throw new Exception("Failed to prepare profile image update: " . $conn->error);
            }
            $imageStmt->bind_param("is", $userId, $profileImage);
            if (!$imageStmt->execute()) {
                throw new Exception("Failed to update profile image: " . $imageStmt->error);
            }
        } else {
            // Clear so reads can fall back to gallery image if present.
            $clearQuery = "INSERT INTO trainer_profiles (user_id, profile_image)
                           VALUES (?, NULL)
                           ON DUPLICATE KEY UPDATE profile_image = NULL";
            $clearStmt = $conn->prepare($clearQuery);
            if (!$clearStmt) {
                throw new Exception("Failed to prepare profile image clear: " . $conn->error);
            }
            $clearStmt->bind_param("i", $userId);
            if (!$clearStmt->execute()) {
                throw new Exception("Failed to clear profile image: " . $clearStmt->error);
            }
        }
    }

    $conn->commit();
    
    error_log("UpdateTrainerProfile - Profile updated successfully");

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);

} catch (Exception $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        try {
            $conn->rollback();
        } catch (Exception $ignored) {
            // no-op
        }
    }
    error_log("UpdateTrainerProfile - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
