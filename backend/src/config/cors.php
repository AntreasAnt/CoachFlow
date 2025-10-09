<?php

// Define APP_RUNNING to allow access to controllers and models


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

if (!defined('APP_RUNNING')) {
    http_response_code(403);
    exit('Forbidden');
}

// Define allowed origins (update for production)
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
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Define allowed request headers (including CSRF token)
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With");

// Ensure responses are sent in JSON format with UTF-8 encoding
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Credentials: true");

// Content Security Policy Headers
header("Content-Security-Policy: " . 
    "default-src 'self'; " .
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " .
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " .
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; " .
    "img-src 'self' data: https: blob:; " .
    "connect-src 'self' " . AppConfig::getFrontendUrl() . " " . AppConfig::getBackendUrl() . "; " .
    "frame-ancestors 'none'; " .
    "base-uri 'self'; " .
    "form-action 'self'"
);

// Additional Security Headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Permissions-Policy: camera=(), microphone=(), geolocation=()");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}
