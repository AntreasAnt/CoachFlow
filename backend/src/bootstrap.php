<?php

/**
 * Bootstrap file for loading environment variables
 * Include this file at the beginning of your application
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables from .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

define('APP_RUNNING', true);

// Configure session settings BEFORE starting session
if (session_status() !== PHP_SESSION_ACTIVE) {
    // Set session configurations
    ini_set('session.cookie_lifetime', 86400); // 24 hours cookie
    ini_set('session.gc_maxlifetime', 86400);  // 24 hours server cleanup
    
    session_set_cookie_params([
        'lifetime' => 86400,     // 24 hours
        'path' => '/',           // Available in the entire domain
        'domain' => '',          // Automatic domain detection
        'secure' => false,       // Set to true for HTTPS in production
        'httponly' => true,      // Prevent JavaScript access to session cookie
        'samesite' => 'Lax'      // Prevent cross-site attacks
    ]);
    
    session_start();
}

// Generate CSRF token if not exists (for CSRF protection)
if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

// Send CSRF token to browser via cookie (JavaScript can read this)
setcookie('XSRF-TOKEN', $_SESSION['csrf'], [
    'expires'  => 0,         // Session cookie (expires when browser closes)
    'path'     => '/',       // Available across entire site
    'domain'   => '',        // Auto-detect domain
    'secure'   => false,     // Set to true for HTTPS in production
    'httponly' => false,     // Must be false so JavaScript can read it
    'samesite' => 'Lax',     // Prevent cross-site attacks
]);
