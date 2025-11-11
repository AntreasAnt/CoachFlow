<?php
/**
 * Search Foods Endpoint
 * 
 * Searches for foods in USDA database and user's custom foods
 * Method: GET
 * URL: /backend/src/routes/SearchFoods.php
 * Parameters: query, source (usda|custom|all)
 */

require_once __DIR__ . "/../config/cors.php";

require_once '../config/Database.php';
require_once '../models/NutritionModel.php';
require_once '../services/USDAService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Get query parameters
    $query = isset($_GET['query']) ? trim($_GET['query']) : '';
    $source = isset($_GET['source']) ? $_GET['source'] : 'all';
    
    if (empty($query)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Search query is required']);
        exit;
    }
    
    $model = new NutritionModel();
    $usdaService = new USDAService();
    
    $results = [
        'usda_foods' => [],
        'custom_foods' => []
    ];
    
    // Search USDA database
    if ($source === 'all' || $source === 'usda') {
        // First check cache
        $cachedFoods = $model->searchCachedUSDAFoods($query);
        
        if (!empty($cachedFoods)) {
            $results['usda_foods'] = $cachedFoods;
            error_log("SearchFoods: Found " . count($cachedFoods) . " cached foods for query: " . $query);
        } else {
            // Search USDA API (without portions for speed)
            error_log("SearchFoods: Searching USDA API for: " . $query);
            $usdaResults = $usdaService->searchFoods($query, 20, [], false); // false = no portions on search
            $results['usda_foods'] = $usdaResults;
            error_log("SearchFoods: USDA API returned " . count($usdaResults) . " foods");
        }
    }
    
    // Search custom foods
    if ($source === 'all' || $source === 'custom') {
        $customFoods = $model->getCustomFoods($userId);
        
        // Filter custom foods by query
        $results['custom_foods'] = array_values(array_filter($customFoods, function($food) use ($query) {
            return stripos($food['name'], $query) !== false || 
                   stripos($food['brand_name'], $query) !== false;
        }));
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'results' => $results,
        'count' => count($results['usda_foods']) + count($results['custom_foods'])
    ]);
    
} catch (Exception $e) {
    error_log("Search foods endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
