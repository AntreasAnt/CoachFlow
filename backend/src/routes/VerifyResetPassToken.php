<?php
/**
 * Token Confirmation Route
 * 
 * Handles verification of user email tokens:
 * - Receives token via GET or POST request
 * - Sends token for check
 */

// Set response type to JSON
header('Content-Type: application/json');
// Enable CORS for cross-origin requests
include_once("../config/cors.php");
// Include controller for user operations
include_once("../controllers/UserController.php");

$token = null;

// Handle both GET and POST methods
if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $token = $_GET['token'] ?? null;
    $email = $_GET['email'] ?? null;
} elseif ($_SERVER["REQUEST_METHOD"] == "POST") {
    $inputData = json_decode(file_get_contents("php://input"), true);
    $token = null;



}

// Check if token exists
if (!$token) {
    echo json_encode([
        'success' => false,
        'message' => 'Token is required'
    ]);
    exit;
}


// Create controller for token verification
$notificationController = new NotificationController();

$inputData = [
    'verificationCode' => $token,
    'email' => $email
];

// Verify token and get result
$response = $notificationController->ResetPassTokenVerification($inputData);

// Send JSON response back
echo json_encode($response);