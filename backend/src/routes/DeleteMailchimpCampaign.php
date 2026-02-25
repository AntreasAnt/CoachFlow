<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can delete Mailchimp campaigns
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

$campaignId = trim($input['campaignId']);

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
    
    // Delete campaign from Mailchimp
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
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
    
    if ($httpCode === 204) {
        echo json_encode([
            'success' => true,
            'message' => 'Campaign deleted successfully'
        ]);
    } else {
        $responseData = json_decode($response, true);
        $errorMessage = 'Failed to delete campaign';
        
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
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting campaign: ' . $e->getMessage()
    ]);
}
