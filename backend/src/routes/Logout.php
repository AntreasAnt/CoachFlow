<?php

/**
 * Logout Route Handler
 * 
 * This script handles user logout requests by:
 * 1. Setting appropriate headers
 * 2. Initializing CORS
 * 3. Processing logout through UserController
 * 4. Returning JSON response
 */

// Set JSON response header
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../controllers/UserController.php");
// Include necessary CORS and controller files
try {
    // Initialize UserController and process logout
    $userController = new UserController();
    $response = $userController->logout();
    // Return success/failure response as JSON
    echo json_encode($response);
} catch (Exception $e) {
    // Handle any unexpected errors during logout
    echo json_encode([
        'success' => false,
        'message' => 'Server error during logout'
    ]);
}
