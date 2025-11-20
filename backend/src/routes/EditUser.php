<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../controllers/UserController.php");
include_once("../config/Auth.php");

// Only admin and manager can edit users
checkAuth(['admin','manager']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$userController = new UserController();
$result = $userController->saveEditUser($input);

if ($result) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update user']);
}
