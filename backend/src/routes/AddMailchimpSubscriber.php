<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

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

if (!isset($data['email']) || empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Valid email address is required'
    ]);
    exit;
}

$audienceId = trim($data['audienceId']);
$email = trim($data['email']);
$firstName = isset($data['firstName']) ? trim($data['firstName']) : '';
$lastName = isset($data['lastName']) ? trim($data['lastName']) : '';
$status = isset($data['status']) ? trim($data['status']) : 'subscribed'; // subscribed, pending, unsubscribed

try {
    // Get API key from environment variables
    $apiKey = $_ENV['MAILCHIMP_API_KEY'] ?? null;
    
    if (!$apiKey || $apiKey === 'your_mailchimp_api_key_here-us1') {
        echo json_encode([
            'success' => false,
            'message' => 'No Mailchimp API key configured in .env file'
        ]);
        exit;
    }
    
    // Extract server prefix from API key
    $parts = explode('-', $apiKey);
    if (count($parts) !== 2) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid API key format in .env file'
        ]);
        exit;
    }
    
    $serverPrefix = $parts[1];
    
    // Prepare member data
    $memberData = [
        'email_address' => $email,
        'status' => $status,
    ];
    
    // Add merge fields if provided
    if (!empty($firstName) || !empty($lastName)) {
        $memberData['merge_fields'] = [];
        if (!empty($firstName)) {
            $memberData['merge_fields']['FNAME'] = $firstName;
        }
        if (!empty($lastName)) {
            $memberData['merge_fields']['LNAME'] = $lastName;
        }
    }
    
    // Add member to Mailchimp audience
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/lists/{$audienceId}/members");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($memberData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to connect to Mailchimp API: ' . $curlError
        ]);
        exit;
    }
    
    $responseData = json_decode($response, true);
    
    if ($httpCode === 200 || $httpCode === 201) {
        echo json_encode([
            'success' => true,
            'message' => 'Subscriber added successfully',
            'data' => [
                'email' => $responseData['email_address'] ?? $email,
                'status' => $responseData['status'] ?? $status,
                'id' => $responseData['id'] ?? null
            ]
        ]);
    } else {
        $errorMessage = 'Failed to add subscriber';
        
        if (isset($responseData['title']) && isset($responseData['detail'])) {
            $errorMessage = $responseData['title'] . ': ' . $responseData['detail'];
        } elseif (isset($responseData['title'])) {
            $errorMessage = $responseData['title'];
        } elseif (isset($responseData['detail'])) {
            $errorMessage = $responseData['detail'];
        }
        
        echo json_encode([
            'success' => false,
            'message' => $errorMessage,
            'httpCode' => $httpCode,
            'response' => $responseData
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error adding subscriber: ' . $e->getMessage()
    ]);
}
