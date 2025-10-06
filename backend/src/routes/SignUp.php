<?php
/**
 * SignUp Route
 * 
 * Handles new user registration requests
 * Accepts user data via POST and returns JSON response
 */

// Enable cross-origin requests FIRST
include_once("../config/cors.php");

// Include user management functionality
include_once("../controllers/UserController.php");

// Get the POST data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get JSON data from request
    $inputData = json_decode(file_get_contents("php://input"), true);

    // Create instance of UserController
    $userController = new UserController();

    // Create new user and get result
    $response = $userController->createUser($inputData);

    // Send JSON response back
    echo json_encode($response);
}
