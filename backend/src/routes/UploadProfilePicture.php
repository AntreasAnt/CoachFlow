<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");
include_once("../controllers/UserController.php");

checkAuth(['trainer', 'trainee', 'admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

if (!isset($_FILES['profile_picture'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No file uploaded'
    ]);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    $userController = new UserController();
    $result = $userController->handleProfilePictureUpload($userId, $_FILES['profile_picture']);

    if (!isset($result['success']) || !$result['success']) {
        echo json_encode($result);
        exit;
    }

    $imageUrl = $result['imageUrl'] ?? null;

    if ($imageUrl) {
        // Keep trainer_profiles image in sync so trainee views show uploaded photo
        // If imageUrl is large (data URI fallback), clear trainer_profiles.profile_image
        // and rely on gallery fallback in read queries.
        $database = new Database();
        $conn = $database->connect();
        if (strlen($imageUrl) <= 240) {
            $syncQuery = "INSERT INTO trainer_profiles (user_id, profile_image)
                          VALUES (?, ?)
                          ON DUPLICATE KEY UPDATE profile_image = VALUES(profile_image)";
            $syncStmt = $conn->prepare($syncQuery);
            if ($syncStmt) {
                $syncStmt->bind_param("is", $userId, $imageUrl);
                $syncStmt->execute();
            }
        } else {
            $clearQuery = "INSERT INTO trainer_profiles (user_id, profile_image)
                           VALUES (?, NULL)
                           ON DUPLICATE KEY UPDATE profile_image = NULL";
            $clearStmt = $conn->prepare($clearQuery);
            if ($clearStmt) {
                $clearStmt->bind_param("i", $userId);
                $clearStmt->execute();
            }
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Profile picture updated successfully',
        'imageUrl' => $imageUrl
    ]);

} catch (Exception $e) {
    error_log('UploadProfilePicture error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to upload profile picture'
    ]);
}
