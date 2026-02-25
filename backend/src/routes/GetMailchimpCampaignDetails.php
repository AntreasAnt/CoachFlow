<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can get Mailchimp campaign details
checkAuth(['admin']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get campaign ID from query string
if (!isset($_GET['campaignId']) || empty($_GET['campaignId'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Campaign ID is required'
    ]);
    exit;
}

$campaignId = trim($_GET['campaignId']);

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
    
    // Get campaign details
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
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
    
    $campaignData = json_decode($response, true);
    
    if ($httpCode === 200) {
        // Get campaign content
        $ch2 = curl_init();
        curl_setopt($ch2, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}/content");
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        
        $contentResponse = curl_exec($ch2);
        $contentHttpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);
        
        $contentData = json_decode($contentResponse, true);
        
        echo json_encode([
            'success' => true,
            'campaign' => [
                'id' => $campaignData['id'] ?? null,
                'subject' => $campaignData['settings']['subject_line'] ?? '',
                'fromName' => $campaignData['settings']['from_name'] ?? '',
                'replyTo' => $campaignData['settings']['reply_to'] ?? '',
                'audienceId' => $campaignData['recipients']['list_id'] ?? '',
                'audienceName' => $campaignData['recipients']['list_name'] ?? '',
                'status' => $campaignData['status'] ?? '',
                'htmlContent' => $contentHttpCode === 200 ? ($contentData['html'] ?? '') : '',
                'sendTime' => $campaignData['send_time'] ?? null,
                'emailsSent' => $campaignData['emails_sent'] ?? 0
            ]
        ]);
    } else {
        $errorMessage = 'Failed to get campaign details';
        
        if (isset($campaignData['title']) && isset($campaignData['detail'])) {
            $errorMessage = $campaignData['title'] . ': ' . $campaignData['detail'];
        } elseif (isset($campaignData['title'])) {
            $errorMessage = $campaignData['title'];
        } elseif (isset($campaignData['detail'])) {
            $errorMessage = $campaignData['detail'];
        }
        
        echo json_encode([
            'success' => false,
            'message' => $errorMessage,
            'httpCode' => $httpCode
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error getting campaign details: ' . $e->getMessage()
    ]);
}
