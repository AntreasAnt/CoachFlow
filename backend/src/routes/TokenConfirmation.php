<?php
/**
 * Token Confirmation Route
 * 
 * Handles verification of user email tokens:
 * - Receives token via POST request
 * - Sends token for check
 */

// Set response type to JSON
header('Content-Type: application/json');
// Enable CORS for cross-origin requests
include_once("../config/cors.php");
// Include controller for user operations
include_once("../controllers/UserController.php");

// Get the POST data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
   // Get JSON data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

   // Create controller for token verification
    $notificationController = new NotificationController();
// Verify token and get result
    $response = $notificationController->TokenVerification($inputData);
    

       // Send JSON response back
    echo json_encode($response);
}
