<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can send Mailchimp campaigns
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
    
    // First, fetch the campaign to get its list_id
    $chCheck = curl_init();
    curl_setopt($chCheck, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}");
    curl_setopt($chCheck, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chCheck, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    $campData = json_decode(curl_exec($chCheck), true);
    curl_close($chCheck);
    
    if (isset($campData['recipients']['list_id'])) {
        // Force refresh the recipients cache in Mailchimp by re-patching the list_id
        // This fixes the "Your advanced segment is empty. recipients not ready" error
        // that happens if a campaign was created before users were added to the audience.
        $patchData = [
            'recipients' => [
                'list_id' => $campData['recipients']['list_id']
            ]
        ];
        $chPatch = curl_init();
        curl_setopt($chPatch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}");
        curl_setopt($chPatch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chPatch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($chPatch, CURLOPT_POSTFIELDS, json_encode($patchData));
        curl_setopt($chPatch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ]);
        curl_exec($chPatch);
        curl_close($chPatch);
    }
    
    // Send campaign via Mailchimp
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns/{$campaignId}/actions/send");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 204 || $httpCode === 200) {
        echo json_encode([
            'success' => true,
            'message' => 'Campaign sent successfully'
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'message' => $error['detail'] ?? 'Failed to send campaign'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error sending campaign: ' . $e->getMessage()
    ]);
}
?>
