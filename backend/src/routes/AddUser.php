<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../controllers/UserController.php");
include_once("../config/Auth.php");

// Only admin can add users
checkAuth(['admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$userController = new UserController();
$result = $userController->createUser($input);

if ($result && isset($result['success']) && $result['success'] === true) {
    echo json_encode(['success' => true, 'UserID' => $result['UserID']]);
} else {
    echo json_encode($result);
}
