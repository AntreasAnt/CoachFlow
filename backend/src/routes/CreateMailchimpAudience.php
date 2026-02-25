<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can create Mailchimp audiences
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
if (!isset($data['name']) || empty($data['name'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Audience name is required'
    ]);
    exit;
}

if (!isset($data['fromName']) || empty($data['fromName'])) {
    echo json_encode([
        'success' => false,
        'message' => 'From name is required'
    ]);
    exit;
}

if (!isset($data['fromEmail']) || empty($data['fromEmail']) || !filter_var($data['fromEmail'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Valid from email is required'
    ]);
    exit;
}

if (!isset($data['companyName']) || empty($data['companyName'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Company name is required'
    ]);
    exit;
}

if (!isset($data['address1']) || empty($data['address1'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Address is required'
    ]);
    exit;
}

if (!isset($data['city']) || empty($data['city'])) {
    echo json_encode([
        'success' => false,
        'message' => 'City is required'
    ]);
    exit;
}

if (!isset($data['state']) || empty($data['state'])) {
    echo json_encode([
        'success' => false,
        'message' => 'State/Province is required'
    ]);
    exit;
}

if (!isset($data['zip']) || empty($data['zip'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Postal code is required'
    ]);
    exit;
}

if (!isset($data['country']) || empty($data['country'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Country is required'
    ]);
    exit;
}

$name = trim($data['name']);
$fromName = trim($data['fromName']);
$fromEmail = trim($data['fromEmail']);
$companyName = trim($data['companyName']);
$address1 = trim($data['address1']);
$address2 = isset($data['address2']) ? trim($data['address2']) : '';
$city = trim($data['city']);
$state = trim($data['state']);
$zip = trim($data['zip']);
$country = trim($data['country']);
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$permissionReminder = isset($data['permissionReminder']) ? trim($data['permissionReminder']) : 'You are receiving this email because you signed up on our website.';
$emailTypeOption = isset($data['emailTypeOption']) ? (bool)$data['emailTypeOption'] : false;

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
    
    // Prepare audience data
    $audienceData = [
        'name' => $name,
        'contact' => [
            'company' => $companyName,
            'address1' => $address1,
            'address2' => $address2,
            'city' => $city,
            'state' => $state,
            'zip' => $zip,
            'country' => $country,
            'phone' => $phone
        ],
        'permission_reminder' => $permissionReminder,
        'campaign_defaults' => [
            'from_name' => $fromName,
            'from_email' => $fromEmail,
            'subject' => '',
            'language' => 'en'
        ],
        'email_type_option' => $emailTypeOption
    ];
    
    // Create audience in Mailchimp
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/lists");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($audienceData));
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
            'message' => 'Audience created successfully',
            'data' => [
                'id' => $responseData['id'] ?? null,
                'name' => $responseData['name'] ?? $name,
                'member_count' => $responseData['stats']['member_count'] ?? 0
            ]
        ]);
    } else {
        $errorMessage = 'Failed to create audience';
        
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
        'message' => 'Error creating audience: ' . $e->getMessage()
    ]);
}
