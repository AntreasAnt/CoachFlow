<?php

// Prevent direct access to this file
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access to this file is not allowed.');
}

/**
 * Mail Configuration Class
 * 
 * This class defines SMTP settings for sending emails via Gmail.
 */

class MailConfig
{
    // SMTP Configuration - Get from environment variables
    public static function getSmtpHost() {
        return $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
    }

    public static function getSmtpPort() {
        return $_ENV['SMTP_PORT'] ?? 587;
    }

    public static function getSmtpUsername() {
        return $_ENV['SMTP_USERNAME'] ?? '';
    }

    public static function getSmtpPassword() {
        return $_ENV['SMTP_PASSWORD'] ?? '';
    }

    // Email Sender Information
    const FROM_EMAIL = 'coachflow.inbox@gmail.com';
    const FROM_NAME = 'CoachFlow';
}
