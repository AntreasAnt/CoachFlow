<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../models/UserModel.php");
include_once("../config/Auth.php");

checkAuth([1, 2, 3]);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

$userModel = new UserModel();
$userId = $_SESSION['user_id'];
$user = $userModel->getprofileById($userId);

if ($user) {
    // Format the response data
    $responseData = [
        'userId' => $user['userid'],
        'name' => $user['username'],
        'email' => $user['email'],
        'profilePicture' => $user['image']

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
