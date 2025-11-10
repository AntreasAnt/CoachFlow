<?php
/**
 * Test USDA API Endpoint
 * This is a simple test to verify USDA API is working
 */

define('APP_RUNNING', true);

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load bootstrap (environment variables, session, etc.)
require_once '../bootstrap.php';
require_once '../services/USDAService.php';

try {
    echo json_encode([
        'step' => 'Starting test',
        'env_loaded' => isset($_ENV['USDA_API_KEY']),
        'api_key_present' => !empty($_ENV['USDA_API_KEY']),
        'api_key_length' => strlen($_ENV['USDA_API_KEY'] ?? '')
    ]);
    echo "\n\n";
    
    $service = new USDAService();
    echo json_encode(['step' => 'USDAService created']);
    echo "\n\n";
    
    $results = $service->searchFoods('chicken', 5);
    
    echo json_encode([
        'success' => true,
        'results_count' => count($results),
        'results' => $results
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
