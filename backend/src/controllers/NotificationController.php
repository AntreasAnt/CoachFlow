<?php

// This file contains the NotificationController class which handles the user registration verification process. 
// It is responsible for generating a confirmation token, saving it, and sending a confirmation email to the user.
// It also handles token verification when the user submits the token for validation.

require(__DIR__ . '/../services/MailService.php'); // Include the MailService class for sending emails
require_once(__DIR__ . '/../../vendor/autoload.php'); // Autoload vendor classes, usually for external libraries
require_once(__DIR__ . '/../config/MailConfig.php'); // Include configuration for mail service
include_once("../models/NotificationModel.php"); // Include NotificationModel for database interaction
include_once("../controllers/UserController.php"); // Include UserController for user operations
class NotificationController extends NotificationModel
{
    private $mailService; // MailService instance to handle email sending


    // Method to handle the signup verification request
    public function SignUpVerificationRequest($userEmail, $username)
    {
        try {
            error_log("DEBUG: Starting SignUpVerificationRequest for email: " . $userEmail);
            parent::__construct(); // Call the parent class (NotificationModel) constructor for initialization

            // Instantiate the MailService to send emails
            error_log("DEBUG: About to create MailService instance");
            $this->mailService = new MailService();
            error_log("DEBUG: MailService instance created successfully");

            // Generate a random 5-digit confirmation token for the user
            $confirmationToken = str_pad(random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            error_log("DEBUG: Generated token: " . $confirmationToken);

            // Save the generated token in the database using the parent class method
            $tokenSaved = parent::saveToken($userEmail, $confirmationToken);

            // If saving the token failed, throw an exception
            if (!$tokenSaved) {
                throw new \Exception("Failed to save token");
            }
            error_log("DEBUG: Token saved successfully, about to send email");

            // Send the confirmation email to the user with the token
            $this->mailService->sendConfirmationEmail($userEmail, $username, $confirmationToken);
            error_log("DEBUG: Email sent successfully");

            return true; // Return true indicating successful token generation and email sending
        } catch (\Exception $e) {
            // Log any errors that occur during the process
            error_log("SignUpVerificationRequest Error: " . $e->getMessage());
            return false; // Return false indicating failure
        }
    }


    // Method to verify the token input by the user
    public function TokenVerification($inputData)
    {
        // Check if the token is exactly 5 digits long
        if (strlen($inputData["token"]) !== 5) {

            // Return an error response if the token is not 5 digits
            $response = [
                'success' => false,
                'message' => 'Code must be exactly 5 digits'
            ];

            return $response;
        }

        $user = $this->checkMatchingToken($inputData["email"], $inputData["token"]);

        // Check if the token matches the one stored in the database
        if ($user !== false) {

            $UserLogin = new UserController();
            $UserLogin->defineSession($user);



            $response = [
                "success" => true,
                "message" => "User login successfully",
                "user" => [
                    "id" => $user['userid'],
                    "privileges" => $user['role'], // Use the role field from ENUM
                    "username" => $user['username']
                ]
            ];
        } else {
            // Return failure response if the token is invalid
            $response = [
                'success' => false,
                'message' => 'Token is invalid'
            ];
        }

        // Return the response to the user
        return $response;
    }
    public function ResetPasswordRequest($email)
    {
        //clean email
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);

        $response = [];
        $User = new UserController();
        $isUser = $User->isEmailExists($email);

        //create a random 5 digit number
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        $token = '';
        for ($i = 0; $i < 12; $i++) {
            $token .= $characters[random_int(0, strlen($characters) - 1)];
        }

        if ($isUser) {
            if ($this->SavePasswordToken($email, $token)) {

                $mailService = new MailService();
                if ($mailService->sendPasswordResetEmail($email, $token)) {
                    $response = [
                        "success" => true,
                        "message" => "Email sent successfully",
                    ];
                } else {
                    $response = [
                        "success" => false,
                        "message" => "Email not sent",
                    ];
                }
            }
        } else {
            $response = [
                "success" => false,
                "message" => "Email not found",
            ];
        }

        return $response;
    }


    public function ResetPassTokenVerification($inputData)
    {

        // Check if the token is exactly 5 digits long
        if (strlen($inputData["verificationCode"]) !== 12) {

            // Return an error response if the token is not 12 digits
            $response = [
                'success' => false,
                'message' => 'Code must be exactly 12 digits'
            ];

            return $response;
        }


        $user = $this->checkResetPassMatchingToken($inputData["email"], $inputData["verificationCode"]);
        // Check if the token matches the one stored in the database

        if ($user !== false) {

            $response = [
                "success" => true,
                "message" => "Token verified successfully",
                "user" => $user
            ];
        } else {
            // Return failure response if the token is invalid
            $response = [
                'success' => false,
                'message' => 'Token is invalid'
            ];
        }

        // Return the response to the user
        return $response;
    }
}
