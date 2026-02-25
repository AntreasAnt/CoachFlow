<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can create Mailchimp campaigns
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
if (!isset($input['subject']) || !isset($input['fromName']) || !isset($input['replyTo']) || !isset($input['audienceId']) || !isset($input['htmlContent'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields'
    ]);
    exit;
}

$subject = trim($input['subject']);
$fromName = trim($input['fromName']);
$replyTo = trim($input['replyTo']);
$audienceId = trim($input['audienceId']);
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
    
    // Create campaign in Mailchimp
    $campaignData = [
        'type' => 'regular',
        'recipients' => [
            'list_id' => $audienceId
        ],
        'settings' => [
            'subject_line' => $subject,
            'from_name' => $fromName,
            'reply_to' => $replyTo,
            'title' => $subject
        ]
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($campaignData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $campaign = json_decode($response, true);
        $campaignId = $campaign['id'];
        
        // Set campaign content
        $contentData = [
            'html' => $htmlContent
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}/content");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($contentData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        
        $contentResponse = curl_exec($ch);
        $contentHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($contentHttpCode === 200) {
            echo json_encode([
                'success' => true,
                'message' => 'Campaign created successfully',
                'campaign' => [
                    'id' => $campaignId,
                    'name' => $subject,
                    'status' => 'save'
                ]
            ]);
        } else {
            $contentError = json_decode($contentResponse, true);
            echo json_encode([
                'success' => false,
                'message' => 'Campaign created but failed to set content: ' . ($contentError['detail'] ?? 'Unknown error')
            ]);
        }
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'message' => $error['detail'] ?? 'Failed to create campaign in Mailchimp'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error creating campaign: ' . $e->getMessage()
    ]);
}
?>
