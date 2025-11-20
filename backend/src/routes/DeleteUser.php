<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../controllers/UserController.php");
include_once("../config/Auth.php");

// Only admin can delete users
checkAuth(['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userController = new UserController();
$result = $userController->updateIsDeletedStatus($input['userIds'] ?? $input);

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Users deleted']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete users']);
}
