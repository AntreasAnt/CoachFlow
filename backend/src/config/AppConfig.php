<?php

/**
 * Application Configuration Class
 * 
 * This class defines general application settings and URLs.
 */

class AppConfig
{
    // Application URLs
    public static function getFrontendUrl() {
        return $_ENV['FRONTEND_URL'] ?? 'http://localhost:5174';
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
