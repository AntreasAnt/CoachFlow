<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");

// Only admins can get Mailchimp audiences
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

    // Determine default audiences from env
    $defaultIds = [];
    $csv = trim((string)($_ENV['MAILCHIMP_DEFAULT_AUDIENCE_IDS'] ?? ''));
    if ($csv !== '') {
        foreach (explode(',', $csv) as $part) {
            $id = trim($part);
            if ($id !== '') {
                $defaultIds[] = $id;
            }
        }
    }
    $singleDefault = trim((string)($_ENV['MAILCHIMP_DEFAULT_AUDIENCE_ID'] ?? ''));
    if ($singleDefault !== '') {
        $defaultIds[] = $singleDefault;
    }
    $defaultIds = array_values(array_unique($defaultIds));
    
    // Fetch audiences (lists) from Mailchimp
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/lists?count=100&sort_field=date_created&sort_dir=DESC");
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
        
        // Format audiences for frontend
        $audiences = array_map(function($list) use ($defaultIds) {
            $isDefault = in_array($list['id'], $defaultIds, true);
            return [
                'id' => $list['id'],
                'name' => $list['name'],
                'is_default' => $isDefault,
                'member_count' => $list['stats']['member_count'] ?? 0,
                'unsubscribe_count' => $list['stats']['unsubscribe_count'] ?? 0,
                'cleaned_count' => $list['stats']['cleaned_count'] ?? 0,
                'date_created' => $list['date_created'],
                'contact' => [
                    'company' => $list['contact']['company'] ?? '',
                    'address1' => $list['contact']['address1'] ?? '',
                    'city' => $list['contact']['city'] ?? '',
                    'state' => $list['contact']['state'] ?? '',
                    'zip' => $list['contact']['zip'] ?? '',
                    'country' => $list['contact']['country'] ?? ''
                ]
            ];
        }, $data['lists'] ?? []);
        
        echo json_encode([
            'success' => true,
            'audiences' => $audiences
        ]);
    } else {
        $error = json_decode($response, true);
        echo json_encode([
            'success' => false,
            'message' => $error['detail'] ?? 'Failed to fetch audiences from Mailchimp'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching audiences: ' . $e->getMessage()
    ]);
}
?>
