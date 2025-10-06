<?php
require_once __DIR__ . '/../models/EmailModel.php';
require_once __DIR__ . '/../config/cors.php';
require_once(__DIR__ . '/../../vendor/autoload.php'); // Autoload external libraries

class EmailController
{
    private $emailModel;

    public function __construct()
    {
        $this->emailModel = new EmailModel();
    }

    public function sendEmail()
    {
        try {
            // Get data from request body (JSON)
            $data = json_decode(file_get_contents('php://input'), true);
            error_log("Received email request: " . json_encode($data));
            // Check if subject and content exist
            if (!isset($data['subject']) || !isset($data['body'])) {
                throw new Exception('Subject and content are required');
            }

            $recipients = [];
            $sendToAll = isset($data['sendToAll']) && $data['sendToAll'] === true;

            // If not sending to all, recipients must exist
            if (!$sendToAll && (!isset($data['recipients']) || empty($data['recipients']))) {
                throw new Exception('Recipients are required when not sending to all');
            }

            // Filter recipients (remove empty ones)
            if (!$sendToAll) {
                $recipients = array_filter($data['recipients'], 'trim');
            }

            // Call the email sending method from the model
            $result = $this->emailModel->sendEmail($recipients, trim($data['subject']), trim($data['body']));
            
            // Check if sending failed
            if (!$result['success']) {
                throw new Exception($result['error'] ?? 'Failed to send email');
            }

            // Return successful result
            echo json_encode($result);
            
        } catch (Exception $e) {
            // Log error
            error_log("EmailController Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    // Function to return available emails
    public function getAvailableEmails()
    {
        try {
            // Call the method to get emails from the model
            $emails = $this->emailModel->getAvailableEmails();
            echo json_encode([
                'success' => true,
                'emails' => $emails
            ]);
        } catch (Exception $e) {
            // Log error and send response with code 500
            error_log("Email Retrieval Error: " . $e->getMessage());
            $this->sendError($e->getMessage(), 500);
        }
    }

    // Private helper function to send errors with HTTP status code
    private function sendError($message, $code)
    {
        http_response_code($code);
        echo json_encode(['error' => $message]);
    }
}