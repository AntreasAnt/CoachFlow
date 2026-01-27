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
    
    // Search custom foods (user's own + trainer's custom foods)
    if ($source === 'all' || $source === 'custom') {
        $customFoods = $model->getCustomFoods($userId);
        
        // Filter custom foods by query
        $results['custom_foods'] = array_values(array_filter($customFoods, function($food) use ($query) {
            return stripos($food['name'], $query) !== false || 
                   stripos($food['brand_name'], $query) !== false;
        }));
        
        // Also include trainer's custom foods
        $db = new Database();
        $conn = $db->connect();
        $userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
        
        // Check if table exists
        $tableCheck = $conn->query("SHOW TABLES LIKE 'trainer_custom_foods'");
        if ($tableCheck && $tableCheck->num_rows > 0) {
            if ($userRole === 'trainer') {
                // Trainer sees their own custom foods
                $trainerQuery = "SELECT id, name, brand as brand_name, serving_size, serving_unit,
                                       calories, protein, carbs, fat, portions
                                FROM trainer_custom_foods
                                WHERE trainer_id = ? AND (name LIKE ? OR brand LIKE ?)
                                ORDER BY name ASC";
                $stmt = $conn->prepare($trainerQuery);
                $searchPattern = '%' . $query . '%';
                $stmt->bind_param('iss', $userId, $searchPattern, $searchPattern);
            } else {
                // Trainee sees custom foods from all their trainers
                $trainerQuery = "SELECT tcf.id, tcf.name, tcf.brand as brand_name, tcf.serving_size, 
                                       tcf.serving_unit, tcf.calories, tcf.protein, tcf.carbs, tcf.fat,
                                       tcf.portions, u.username as trainer_name
                                FROM trainer_custom_foods tcf
                                JOIN coaching_relationships cr ON tcf.trainer_id = cr.trainer_id
                                JOIN user u ON tcf.trainer_id = u.userid
                                WHERE cr.trainee_id = ? AND cr.status = 'active'
                                  AND (tcf.name LIKE ? OR tcf.brand LIKE ?)
                                ORDER BY tcf.name ASC";
                $stmt = $conn->prepare($trainerQuery);
                $searchPattern = '%' . $query . '%';
                $stmt->bind_param('iss', $userId, $searchPattern, $searchPattern);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $trainerFood = [
                    'id' => (int)$row['id'],
                    'source' => 'trainer_custom',
                    'name' => $row['name'],
                    'brand_name' => $row['brand_name'] ?? '',
                    'serving_size' => (float)$row['serving_size'],
                    'serving_unit' => $row['serving_unit'],
                    'calories' => (float)$row['calories'],
                    'protein' => (float)$row['protein'],
                    'carbs' => (float)$row['carbs'],
                    'fat' => (float)$row['fat'],
                    'portions' => $row['portions'] ? json_decode($row['portions'], true) : []
                ];
                
                if (isset($row['trainer_name'])) {
                    $trainerFood['trainer_name'] = $row['trainer_name'];
                }
                
                $results['custom_foods'][] = $trainerFood;
            }
            
            $stmt->close();
        }
        $conn->close();
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
