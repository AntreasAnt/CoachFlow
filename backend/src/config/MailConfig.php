<?php

// Prevent direct access to this file
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access to this file is not allowed.');
}

/**
 * Mail Configuration Class
 * 
 * This class defines SendGrid settings for sending emails.
 */

class MailConfig
{
    // SendGrid API Key - Get this from environment variables
    public static function getSendGridApiKey() {
        return $_ENV['SENDGRID_API_KEY'] ?? '';
    }

    // Email Sender Information
    const FROM_EMAIL = 'coachflow.inbox@gmail.com';
    const FROM_NAME = 'CoachFlow';
}
