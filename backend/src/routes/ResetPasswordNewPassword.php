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

// Handle POST method
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $inputData = json_decode(file_get_contents("php://input"), true);
    $token = $inputData['token'] ?? null;
    $email = $inputData['email'] ?? null;
    $password = $inputData['password'] ?? null;
    
}

// Check if required data exists
if (!$token || !$email) {
    echo json_encode([
        'success' => false,
        'message' => 'Token is required'
    ]);
    exit;
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
    'email' => $email,
    'password' => $password
];

// Verify token and get result
$response = $notificationController->ResetPassTokenVerification($inputData);


//If token is valid then proceed to change password
if($response['success'] === true){
    // Create controller for user operations
    $userController = new UserController();
    // Call controller function to change password
    $response = $userController->ResetPassword($inputData);
    
    echo json_encode($response);
}
else{
  
// Send JSON response back
echo json_encode($response);
}