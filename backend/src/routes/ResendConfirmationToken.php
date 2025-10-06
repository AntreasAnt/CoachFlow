

<?php
/**
 * Handles resending verification tokens to users
 * Receives email and username via POST request
 */

// Set response type and allow cross-origin requests
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../controllers/UserController.php");

// Get the POST data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
// Get data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

    // Create instance of UserController
    $notificationController = new NotificationController();

   // Get user details
    $email=$inputData["email"];
    $username=$inputData["username"];
    $response = $notificationController->SignUpVerificationRequest($email,$username);

    // Return result as JSON
    echo json_encode($response);
}
