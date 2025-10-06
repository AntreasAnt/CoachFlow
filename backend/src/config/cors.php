<?php

/**
 * CORS Configuration File
 * 
 * This file handles Cross-Origin Resource Sharing (CORS) settings.
 * It specifies which origins are allowed to access the server, 
 * The allowed HTTP methods, and the permitted headers.
 * 
 * In a production environment, make sure to update `$allowedOrigins`
 * with trusted domains to enhance security.
 */

require_once(__DIR__ . '/../bootstrap.php'); // Load environment variables
require_once(__DIR__ . '/AppConfig.php'); // Load application configuration

// Define allowed origins (update for production)

if (session_status() === PHP_SESSION_NONE) {
    // Set session configurations only if no session is active
    ini_set('session.cookie_lifetime', 86400); // 24 hours cookie
    ini_set('session.gc_maxlifetime', 86400); // 24 hours server

    session_set_cookie_params([
        'lifetime' => 86400, // 24 hours
        'path' => '/', // Available in the entire domain
        'domain' => '',  // Automatic domain detection
        'secure' => false, // True for HTTPS
        'httponly' => true, // Prevent JavaScript access
        'samesite' => 'Lax'
    ]);

    session_start();
    error_log('Session started with ID: ' . session_id());
}


$allowedOrigins = [AppConfig::getFrontendUrl()];

// Get the origin of the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Set CORS headers to allow requests from the allowed origins
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Fallback to the first allowed origin if origin is not set or not allowed
    header("Access-Control-Allow-Origin: " . $allowedOrigins[0]);
}

// Specify allowed HTTP methods for cross-origin requests
header("Access-Control-Allow-Methods: GET, POST,PUT, DELETE,OPTIONS");

// Define allowed request headers
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Ensure responses are sent in JSON format with UTF-8 encoding
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Credentials: true");
// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}
