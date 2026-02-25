<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can get Mailchimp audience members
checkAuth(['admin']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get audience ID from query string
if (!isset($_GET['audienceId']) || empty($_GET['audienceId'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Audience ID is required'
    ]);
    exit;
}

$audienceId = trim($_GET['audienceId']);

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
    
    // Fetch members from Mailchimp
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/lists/{$audienceId}/members?count=1000&sort_field=timestamp_opt&sort_dir=DESC");
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
        
        // Format members for frontend
        $members = array_map(function($member) {
            return [
                'id' => $member['id'],
                'email_address' => $member['email_address'],
                'status' => $member['status'],
                'merge_fields' => $member['merge_fields'] ?? [],
                'timestamp_opt' => $member['timestamp_opt'] ?? null,
                'timestamp_signup' => $member['timestamp_signup'] ?? null
            ];
        }, $data['members'] ?? []);
        
        echo json_encode([
            'success' => true,
            'members' => $members,
            'total_members' => $data['total_items'] ?? 0
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'message' => $error['detail'] ?? 'Failed to fetch audience members from Mailchimp'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching audience members: ' . $e->getMessage()
    ]);
}
?>
