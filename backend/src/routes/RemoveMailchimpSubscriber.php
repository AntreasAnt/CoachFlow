<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
require_once(__DIR__ . '/../services/MailchimpService.php');

// Only admins can remove Mailchimp subscribers
checkAuth(['admin']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['audienceId']) || empty($data['audienceId'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Audience ID is required'
    ]);
    exit;
}
if (!isset($data['email']) || empty($data['email'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Email is required'
    ]);
    exit;
}

$audienceId = trim($data['audienceId']);
$email = trim(strtolower($data['email']));

try {
    if (!MailchimpService::isConfigured()) {
        echo json_encode([
            'success' => false,
            'message' => 'No Mailchimp API key configured in .env file'
        ]);
        exit;
    }

    $result = MailchimpService::deleteMember($audienceId, $email);
    if ($result['success'] ?? false) {
        echo json_encode([
            'success' => true,
            'message' => 'Subscriber removed successfully'
        ]);
        exit;
    }

    echo json_encode([
        'success' => false,
        'message' => $result['message'] ?? 'Failed to remove subscriber'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error removing subscriber: ' . $e->getMessage()
    ]);
}
