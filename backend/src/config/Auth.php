<?php

// Prevent direct access to this file
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access to this file is not allowed.');
}

include_once("../config/cors.php");

/**
* Check if the current user is authenticated and has a valid session
*/  

function checkAuth(array $allowedRoles)
{
    //Check If User Is Logged In
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['message' => 'You are not authorized to access this resource.']);
        exit();
    }
    error_log(message: "User Privileges: " . (isset($_SESSION['user_privileges']) ? $_SESSION['user_privileges'] : 'Not Set'));
    if(!in_array($_SESSION['user_privileges'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['message' => 'You are not authorized to access this resource.']);
        exit();
    }
 
}