<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
require_once(__DIR__ . '/../services/MailchimpService.php');
require_once(__DIR__ . '/../config/Database.php');

// Only admins can add Mailchimp subscribers
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

// Validate required fields
if (!isset($data['audienceId']) || empty($data['audienceId'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Audience ID is required'
    ]);
    exit;
}
$audienceId = trim($data['audienceId']);

$userId = isset($data['userId']) ? trim((string)$data['userId']) : '';
$email = isset($data['email']) ? trim((string)$data['email']) : '';
$firstName = isset($data['firstName']) ? trim((string)$data['firstName']) : '';
$lastName = isset($data['lastName']) ? trim((string)$data['lastName']) : '';

try {
    if (!MailchimpService::isConfigured()) {
        echo json_encode([
            'success' => false,
            'message' => 'No Mailchimp API key configured in .env file'
        ]);
        exit;
    }

    // If a userId is provided, lookup email/name from existing users (preferred flow).
    if ($userId !== '') {
        $conn = (new Database())->connect();
        $stmt = $conn->prepare("SELECT email, full_name, username FROM user WHERE userid = ? AND isdeleted = 0 LIMIT 1");
        $stmt->bind_param('s', $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();

        if (!$row || empty($row['email'])) {
            echo json_encode([
                'success' => false,
                'message' => 'User not found or missing email'
            ]);
            exit;
        }

        $email = trim((string)$row['email']);
        $fullName = trim((string)($row['full_name'] ?? ''));
        $username = trim((string)($row['username'] ?? ''));

        if ($fullName !== '' && ($firstName === '' && $lastName === '')) {
            $parts = preg_split('/\s+/', $fullName);
            $firstName = $parts[0] ?? '';
            $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
        }

        if ($firstName === '' && $username !== '') {
            $firstName = $username;
        }
    }

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode([
            'success' => false,
            'message' => 'Valid email address is required'
        ]);
        exit;
    }

    $mergeFields = [];
    if ($firstName !== '') {
        $mergeFields['FNAME'] = $firstName;
    }
    if ($lastName !== '') {
        $mergeFields['LNAME'] = $lastName;
    }

    $result = MailchimpService::upsertMember($audienceId, $email, $mergeFields);
    if ($result['success'] ?? false) {
        $responseData = $result['data'] ?? [];
        echo json_encode([
            'success' => true,
            'message' => 'Subscriber added successfully',
            'data' => [
                'email' => $responseData['email_address'] ?? $email,
                'status' => $responseData['status'] ?? 'subscribed',
                'id' => $responseData['id'] ?? null
            ]
        ]);
        exit;
    }

    echo json_encode([
        'success' => false,
        'message' => $result['message'] ?? 'Failed to add subscriber'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error adding subscriber: ' . $e->getMessage()
    ]);
}
