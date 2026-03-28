<?php

/**
 * MailService Class
 * 
 * This service handles email functionality for the application using Gmail SMTP.
 * It provides:
 * - Email verification functionality
 * - Password reset functionality
 * - HTML email template generation
 */

require_once(__DIR__ . '/../bootstrap.php'); // Load environment variables
require_once(__DIR__ . '/../config/MailConfig.php');
require_once(__DIR__ . '/../config/AppConfig.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    private $mailer;

    public function __construct()
    {
        error_log("DEBUG: MailService constructor called");
        
        if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            error_log("ERROR: PHPMailer class not found!");
            throw new Exception("PHPMailer library not found. Run 'composer require phpmailer/phpmailer'");
        }
        
        $this->mailer = new PHPMailer(true);
        
        // SMTP Configuration
        $this->mailer->isSMTP();
        $this->mailer->Host = MailConfig::getSmtpHost();
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = MailConfig::getSmtpUsername();
        $this->mailer->Password = MailConfig::getSmtpPassword();
        $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mailer->Port = MailConfig::getSmtpPort();
        
        // Sender Information
        $this->mailer->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
        $this->mailer->isHTML(true);
        
        error_log("DEBUG: MailService constructor completed successfully with Gmail SMTP");
    }

    /**
     * Send account confirmation email with token
     */
    public function sendConfirmationEmail($userEmail, $username, $confirmationToken)
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($userEmail);
            $this->mailer->Subject = "Confirm Your Email Address";

            $this->mailer->Body = "
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
                </div>";

            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            error_log("PHPMailer Error: " . $e->getMessage());
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

            $this->mailer->clearAddresses();
            $this->mailer->addAddress($userEmail);
            $this->mailer->Subject = "Reset Your Password";

            $this->mailer->Body = "
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
                </div>";

            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            throw new Exception("Failed to send password reset email: " . $e->getMessage());
        }
    }
}
