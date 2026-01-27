<?php
include_once("../config/cors.php");

try {
    $isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;

    $response = [
        'success' => 1,
        'privileges' => 'loggedout'  // Default to loggedout
    ];

    if ($isLoggedIn && isset($_SESSION['user_privileges'])) {
        // Since we now use ENUM values directly, we can just pass them through
        $validRoles = ['admin', 'manager', 'trainer', 'trainee'];
        if (in_array($_SESSION['user_privileges'], $validRoles)) {
            $response['privileges'] = $_SESSION['user_privileges'];
        } else {
            // Fallback for any old numeric values that might still be in session
            switch ($_SESSION['user_privileges']) {
                case 1:
                    $response['privileges'] = 'admin';
                    break;
                case 2:
                    $response['privileges'] = 'manager';
                    break;
                case 3:
                    $response['privileges'] = 'trainer';
                    break;
                case 4:
                    $response['privileges'] = 'trainee';
                    break;
                default:
                    $response['privileges'] = 'trainee';
            }
        }
        
        // Add user_id and username to response
        if (isset($_SESSION['user_id'])) {
            $response['user_id'] = $_SESSION['user_id'];
        }
        if (isset($_SESSION['username'])) {
            $response['username'] = $_SESSION['username'];
        }
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => 'An error occurred while verifying privileges'
    ];
}

echo json_encode($response);
