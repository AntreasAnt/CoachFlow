<?php
/**
 * Get Food Portions Endpoint
 * 
 * Fetches detailed portion information for a specific food
 * Method: GET
 * URL: /backend/src/routes/GetFoodPortions.php
 * Parameters: fdc_id (USDA Food Data Central ID)
 */

require_once __DIR__ . "/../config/cors.php";

require_once '../config/Database.php';
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
    
    // Get FDC ID parameter
    $fdcId = isset($_GET['fdc_id']) ? trim($_GET['fdc_id']) : '';
    
    if (empty($fdcId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'FDC ID is required']);
        exit;
    }
    
    $usdaService = new USDAService();
    
    // Get full food details including portions
    $foodDetails = $usdaService->getFoodDetails($fdcId, 'full');
    
    if (!$foodDetails) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Food not found']);
        exit;
    }
    
    $portions = $foodDetails['food_portions'] ?? [];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'portions' => $portions,
        'count' => count($portions)
    ]);
    
} catch (Exception $e) {
    error_log("Get food portions endpoint error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}
