<?php

/**
 * MailService Class
 * 
 * This service handles email functionality for the application using SendGrid.
 * It provides:
 * - Email verification functionality
 * - Password reset functionality
 * - HTML email template generation
 */

require_once(__DIR__ . '/../bootstrap.php'); // Load environment variables
require_once(__DIR__ . '/../config/MailConfig.php');
require_once(__DIR__ . '/../config/AppConfig.php');

class MailService
{
    private $sendgrid;

    public function __construct()
    {
        error_log("DEBUG: MailService constructor called");
        
        if (!class_exists('\SendGrid')) {
            error_log("ERROR: SendGrid class not found!");
            throw new Exception("SendGrid library not found. Run 'composer require sendgrid/sendgrid'");
        }
        
        $apiKey = MailConfig::getSendGridApiKey();
        if (empty($apiKey)) {
            throw new Exception("SendGrid API key not found in environment variables");
        }
        
        error_log("DEBUG: SendGrid class found, creating instance with API key: " . substr($apiKey, 0, 10) . "...");
        $this->sendgrid = new \SendGrid($apiKey);
        error_log("DEBUG: MailService constructor completed successfully");
    }

    /**
     * Send account confirmation email with token
     */
    public function sendConfirmationEmail($userEmail, $username, $confirmationToken)
    {
        try {
            $email = new \SendGrid\Mail\Mail();
            $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
            $email->setSubject("Confirm Your Email Address");
            $email->addTo($userEmail);

            $email->addContent(
                "text/html",
                "
                <div style='
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    text-align: center;
                '>
                    <h2 style='
                        color: #333;
                        margin-bottom: 25px;
                        font-size: 28px;
                        font-weight: 600;
                    '>Welcome to " . MailConfig::FROM_NAME . "!</h2>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 10px;
                    '>Hello {$username},</p>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 25px;
                    '>Please use the code below to confirm your email address:</p>
                    
                    <div style='
                        background-color: #f8f9fa;
                        padding: 25px;
                        margin: 30px auto;
                        border-radius: 10px;
                        border: 2px dashed #dee2e6;
                        display: inline-block;
                        max-width: 300px;
                    '>
                        <div style='
                            font-family: monospace;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 6px;
                            color: #007bff;
                            user-select: all;
                        '>{$confirmationToken}</div>
                    </div>
                    
                    <p style='
                        color: #999;
                        font-size: 14px;
                        line-height: 1.4;
                        margin-top: 25px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    '>
                        This code will expire in 1 minute.<br>
                        If you did not create this account, please ignore this email.
                    </p>
                </div>"
            );

            $response = $this->sendgrid->send($email);

            if ($response->statusCode() !== 202) {
                throw new Exception("Failed to send email. Status code: " . $response->statusCode());
            }

            return true;
        } catch (Exception $e) {
            error_log("SendGrid Error: " . $e->getMessage());
            throw new Exception("Failed to send confirmation email: " . $e->getMessage());
        }
    }

    /**
     * Send password reset email with link
     */
    public function sendPasswordResetEmail($userEmail, $resetToken)
    {
        try {
            $resetUrl = AppConfig::getFrontendUrl() . "/new-password?token={$resetToken}&email={$userEmail}";

            $email = new \SendGrid\Mail\Mail();
            $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
            $email->setSubject("Reset Your Password");
            $email->addTo($userEmail);

            $email->addContent(
                "text/html",
                "
                <div style='
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    text-align: center;
                '>
                    <h2 style='
                        color: #333;
                        margin-bottom: 20px;
                        font-size: 24px;
                        font-weight: 600;
                    '>Password Reset</h2>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 15px;
                    '>Hello,</p>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 25px;
                    '>You recently requested to reset your password. Click the button below to proceed:</p>
                    
                    <div style='margin: 35px 0;'>
                        <a href='{$resetUrl}' style='
                            background-color: #007bff;
                            color: #ffffff;
                            padding: 12px 30px;
                            border-radius: 6px;
                            text-decoration: none;
                            display: inline-block;
                            font-size: 16px;
                            font-weight: 500;
                            transition: background-color 0.3s ease;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        '>Reset Password</a>
                    </div>

                    <div style='
                        margin: 25px auto;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 4px;
                        max-width: 400px;
                    '>
                        <p style='
                            color: #666;
                            margin-bottom: 10px;
                            font-size: 14px;
                        '>Or copy and paste this URL into your browser:</p>
                        <code style='
                            display: block;
                            padding: 10px;
                            background-color: #ffffff;
                            border: 1px solid #ced4da;
                            border-radius: 4px;
                            font-family: monospace;
                            font-size: 12px;
                            color: #495057;
                            word-break: break-all;
                            text-align: left;
                        '>{$resetUrl}</code>
                    </div>
                    
                    <p style='
                        color: #666;
                        font-size: 14px;
                        line-height: 1.4;
                        margin-top: 25px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 4px;
                    '>If you did not request a password reset, please ignore this email.</p>
                </div>"
            );

            $response = $this->sendgrid->send($email);
            return $response->statusCode() === 202;
        } catch (Exception $e) {
            throw new Exception("Failed to send password reset email: " . $e->getMessage());
        }
    }
}
