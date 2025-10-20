<?php

// Prevent direct access to this file
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access to this file is not allowed.');
}

/**
 * Application Configuration Class
 * 
 * This class defines general application settings and URLs.
 */

class AppConfig
{
    // Application URLs
    public static function getFrontendUrl() {
        $urls = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
        // Return the first URL from comma-separated list
        return explode(',', $urls)[0];
    }

    // Get all allowed frontend URLs for CORS
    public static function getAllowedOrigins() {
        $urls = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';
        // Support multiple URLs separated by comma
        return explode(',', $urls);
    }

    public static function getBackendUrl() {
        return $_ENV['BACKEND_URL'] ?? 'http://localhost:8000';
    }

    // Application settings
    const APP_NAME = 'CoachFlow';
    const APP_VERSION = '1.0.0';
    
    // Environment
    public static function getEnvironment() {
        return $_ENV['APP_ENV'] ?? 'development';
    }
    
    public static function isProduction() {
        return self::getEnvironment() === 'production';
    }
    
    public static function isDevelopment() {
        return self::getEnvironment() === 'development';
    }
}
