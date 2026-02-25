<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can get Mailchimp campaigns
checkAuth(['admin']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
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
    
    // Fetch campaigns from Mailchimp
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/campaigns?count=100&sort_field=create_time&sort_dir=DESC");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        
        // Format campaigns for frontend
        $campaigns = array_map(function($campaign) {
            return [
                'id' => $campaign['id'],
                'name' => $campaign['settings']['subject_line'] ?? 'Untitled',
                'subject' => $campaign['settings']['subject_line'] ?? '',
                'status' => $campaign['status'],
                'create_time' => $campaign['create_time'],
                'send_time' => $campaign['send_time'] ?? null,
                'emails_sent' => $campaign['emails_sent'] ?? 0,
                'recipients_count' => $campaign['recipients']['recipient_count'] ?? 0,
                'list_name' => $campaign['recipients']['list_name'] ?? 'Unknown'
            ];
        }, $data['campaigns'] ?? []);
        
        echo json_encode([
            'success' => true,
            'campaigns' => $campaigns
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'message' => $error['detail'] ?? 'Failed to fetch campaigns from Mailchimp'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching campaigns: ' . $e->getMessage()
    ]);
}
?>
