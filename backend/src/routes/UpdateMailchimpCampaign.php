<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can update Mailchimp campaigns
checkAuth(['admin']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['campaignId']) || empty($input['campaignId'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Campaign ID is required'
    ]);
    exit;
}

if (!isset($input['subject']) || !isset($input['fromName']) || !isset($input['replyTo']) || !isset($input['htmlContent'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields'
    ]);
    exit;
}

$campaignId = trim($input['campaignId']);
$subject = trim($input['subject']);
$fromName = trim($input['fromName']);
$replyTo = trim($input['replyTo']);
$htmlContent = $input['htmlContent'];

// Validate email
if (!filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid reply-to email address'
    ]);
    exit;
}

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
    
    // Update campaign settings
    $settingsData = [
        'settings' => [
            'subject_line' => $subject,
            'from_name' => $fromName,
            'reply_to' => $replyTo
        ]
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($settingsData));
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
    
    if ($httpCode !== 200) {
        $errorMessage = 'Failed to update campaign settings';
        
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
            'httpCode' => $httpCode
        ]);
        exit;
    }
    
    // Update campaign content
    $contentData = ['html' => $htmlContent];
    
    $ch2 = curl_init();
    curl_setopt($ch2, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}/content");
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode($contentData));
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $contentResponse = curl_exec($ch2);
    $contentHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);
    
    $contentResponseData = json_decode($contentResponse, true);
    
    if ($contentHttpCode === 200) {
        echo json_encode([
            'success' => true,
            'message' => 'Campaign updated successfully'
        ]);
    } else {
        $errorMessage = 'Campaign settings updated but content update failed';
        
        if (isset($contentResponseData['title']) && isset($contentResponseData['detail'])) {
            $errorMessage .= ': ' . $contentResponseData['title'] . ' - ' . $contentResponseData['detail'];
        }
        
        echo json_encode([
            'success' => false,
            'message' => $errorMessage,
            'httpCode' => $contentHttpCode
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error updating campaign: ' . $e->getMessage()
    ]);
}
