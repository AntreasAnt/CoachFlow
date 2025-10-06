<?php

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

    public const FRONTEND_URL = 'http://localhost:5174';


}
