<?php

if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * USDAService
 * 
 * Service for interacting with USDA FoodData Central API
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 * 
 * Free API Key: Get one at https://fdc.nal.usda.gov/api-key-signup.html
 */
class USDAService
{
    private $apiKey;
    private $baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    
    public function __construct()
    {
        // Get API key from environment variable (loaded from .env file via bootstrap.php)
        $this->apiKey = $_ENV['USDA_API_KEY'] ?? '';
        
        if (empty($this->apiKey)) {
            error_log('WARNING: USDA API key not configured. Please set USDA_API_KEY in .env file');
        }
    }
    
    /**
     * Search for foods in USDA database
     * 
     * @param string $query Search term
     * @param int $pageSize Number of results (max 200)
     * @param array $dataTypes Filter by data types (e.g., ['Survey (FNDDS)', 'Branded'])
     * @param bool $includePortions Whether to fetch full details including portions (slower)
     * @return array Search results
     */
    public function searchFoods($query, $pageSize = 20, $dataTypes = [], $includePortions = false)
    {
        $url = $this->baseUrl . '/foods/search';
        
        $params = [
            'api_key' => $this->apiKey,
            'query' => $query,
            'pageSize' => min($pageSize, 200)
        ];
        
        if (!empty($dataTypes)) {
            $params['dataType'] = $dataTypes;
        }
        
        $response = $this->makeRequest($url, $params);
        
        if ($response && isset($response['foods'])) {
            $results = $this->formatSearchResults($response['foods']);
            
            // If portions are requested, fetch full details for each food
            if ($includePortions && !empty($results)) {
                $results = $this->enrichWithPortions($results);
            }
            
            return $results;
        }
        
        return [];
    }
    
    /**
     * Enrich search results with food portions by fetching full details
     * 
     * @param array $foods Search results
     * @return array Enriched results with portions
     */
    private function enrichWithPortions($foods)
    {
        error_log("Enriching " . count($foods) . " foods with portion data");
        $enrichedCount = 0;
        
        foreach ($foods as &$food) {
            if (isset($food['fdc_id'])) {
                $details = $this->getFoodDetails($food['fdc_id'], 'full');
                if ($details && isset($details['food_portions'])) {
                    $food['food_portions'] = $details['food_portions'];
                    if (!empty($details['food_portions'])) {
                        $enrichedCount++;
                    }
                }
            }
        }
        
        error_log("Successfully enriched $enrichedCount foods with portions");
        return $foods;
    }
    
    /**
     * Get food details by FDC ID
     * 
     * @param string $fdcId FoodData Central ID
     * @param string $format Format (full or abridged)
     * @return array|null Food details
     */
    public function getFoodDetails($fdcId, $format = 'abridged')
    {
        $url = $this->baseUrl . '/food/' . $fdcId;
        
        $params = [
            'api_key' => $this->apiKey,
            'format' => $format
        ];
        
        $response = $this->makeRequest($url, $params);
        
        if ($response) {
            return $this->formatFoodDetails($response);
        }
        
        return null;
    }
    
    /**
     * Format search results to our standard format
     */
    private function formatSearchResults($foods)
    {
        $formatted = [];
        
        foreach ($foods as $food) {
            $formatted[] = [
                'fdc_id' => $food['fdcId'] ?? '',
                'description' => $food['description'] ?? '',
                'brand_name' => $food['brandOwner'] ?? $food['brandName'] ?? null,
                'data_type' => $food['dataType'] ?? null,
                'serving_size' => $food['servingSize'] ?? 100,
                'serving_unit' => $food['servingSizeUnit'] ?? 'g',
                'nutrients' => $this->extractNutrients($food['foodNutrients'] ?? []),
                'food_portions' => $this->extractFoodPortions($food['foodPortions'] ?? [])
            ];
        }
        
        return $formatted;
    }
    
    /**
     * Format detailed food data
     */
    private function formatFoodDetails($food)
    {
        return [
            'fdc_id' => $food['fdcId'] ?? '',
            'description' => $food['description'] ?? '',
            'brand_name' => $food['brandOwner'] ?? $food['brandName'] ?? null,
            'data_type' => $food['dataType'] ?? null,
            'serving_size' => $food['servingSize'] ?? 100,
            'serving_unit' => $food['servingSizeUnit'] ?? 'g',
            'ingredients' => $food['ingredients'] ?? null,
            'nutrients' => $this->extractNutrients($food['foodNutrients'] ?? []),
            'food_portions' => $this->extractFoodPortions($food['foodPortions'] ?? []),
            'api_data' => $food // Store full API response
        ];
    }
    
    /**
     * Extract key nutrients from USDA nutrient array
     */
    private function extractNutrients($nutrients)
    {
        $extracted = [
            'calories' => null,
            'protein' => null,
            'carbs' => null,
            'fat' => null,
            'fiber' => null,
            'sugar' => null,
            'sodium' => null
        ];
        
        foreach ($nutrients as $nutrient) {
            $nutrientId = $nutrient['nutrientId'] ?? null;
            $value = $nutrient['value'] ?? null;
            
            if ($value === null) continue;
            
            // Map USDA nutrient IDs to our fields
            switch ($nutrientId) {
                case 1008: // Energy (kcal)
                    $extracted['calories'] = round($value, 2);
                    break;
                case 1003: // Protein
                    $extracted['protein'] = round($value, 2);
                    break;
                case 1005: // Carbohydrates
                    $extracted['carbs'] = round($value, 2);
                    break;
                case 1004: // Total Fat
                    $extracted['fat'] = round($value, 2);
                    break;
                case 1079: // Fiber
                    $extracted['fiber'] = round($value, 2);
                    break;
                case 2000: // Sugars, total
                    $extracted['sugar'] = round($value, 2);
                    break;
                case 1093: // Sodium
                    $extracted['sodium'] = round($value, 2);
                    break;
            }
        }
        
        return $extracted;
    }
    
    /**
     * Extract food portions (household measures) from USDA data
     * These provide the gram weight for common portions like "1 large egg", "1 slice", etc.
     * 
     * USDA has two different structures:
     * 1. SR Legacy/Foundation: measureUnit.name (e.g., "cup, sliced")
     * 2. Survey (FNDDS): portionDescription (e.g., "1 cup, sliced")
     */
    private function extractFoodPortions($foodPortions)
    {
        $extracted = [];
        
        error_log("DEBUG: Processing " . count($foodPortions) . " portions");
        
        foreach ($foodPortions as $index => $portion) {
            error_log("DEBUG: Portion $index: " . json_encode($portion));
            
            $gramWeight = $portion['gramWeight'] ?? null;
            $amount = $portion['amount'] ?? 1;
            
            // Initialize description
            $description = null;
            $modifier = '';
            $measureUnit = '';
            
            // Structure 2 FIRST: Survey (FNDDS) Foods (flat portionDescription)
            // Check this first because some foods have BOTH but portionDescription is more accurate
            if (isset($portion['portionDescription'])) {
                $portionDesc = $portion['portionDescription'];
                // Only use it if it's not "Quantity not specified"
                if (stripos($portionDesc, 'quantity not specified') === false && 
                    stripos($portionDesc, 'not specified') === false) {
                    $description = $portionDesc;
                    error_log("DEBUG: Extracted from portionDescription: $description");
                    // Parse the description to separate amount/modifier from unit
                    // e.g., "1 fruit, medium" or "1 cup, sliced"
                    if (preg_match('/^(\d+\.?\d*)\s+(.+)/', $description, $matches)) {
                        $amount = floatval($matches[1]);
                        $measureUnit = $matches[2];
                    } else {
                        $measureUnit = $description;
                    }
                }
            }
            
            // Structure 1: SR Legacy/Foundation Foods (nested measureUnit)
            // Only use if we don't have description from portionDescription
            if (!$description && isset($portion['measureUnit'])) {
                error_log("DEBUG: Found measureUnit: " . json_encode($portion['measureUnit']));
                if (is_array($portion['measureUnit']) && isset($portion['measureUnit']['name'])) {
                    $measureUnitName = $portion['measureUnit']['name'];
                    // Only use if it's not "undetermined"
                    if (stripos($measureUnitName, 'undetermined') === false) {
                        $description = $measureUnitName;
                        $measureUnit = $measureUnitName;
                        error_log("DEBUG: Extracted from measureUnit.name: $description");
                    }
                } elseif (is_string($portion['measureUnit'])) {
                    if (stripos($portion['measureUnit'], 'undetermined') === false) {
                        $description = $portion['measureUnit'];
                        $measureUnit = $portion['measureUnit'];
                        error_log("DEBUG: Extracted from measureUnit (string): $description");
                    }
                }
                // Get modifier if available
                $modifier = $portion['modifier'] ?? '';
            }
            
            error_log("DEBUG: Final description: " . ($description ?? 'NULL'));
            
            // Only add if we have weight and description
            if ($gramWeight && $description) {
                // Clean up the description
                $description = trim($description);
                
                // Skip numeric-only descriptions (e.g., "60710")
                if (preg_match('/^\d+$/', $description)) {
                    error_log("DEBUG: Skipping numeric-only description: $description");
                    continue;
                }
                
                // Also skip if modifier is numeric-only (e.g., "90000", "60710")
                if (!empty($modifier) && preg_match('/^\d+$/', $modifier)) {
                    error_log("DEBUG: Skipping portion with numeric modifier: $modifier");
                    continue;
                }
                
                // Create a clean label
                $label = ucfirst(strtolower($description));
                error_log("DEBUG: Adding portion: $label ({$gramWeight}g)");
                
                $extracted[] = [
                    'label' => $label,
                    'description' => $description,
                    'measure_unit' => $measureUnit,
                    'modifier' => $modifier,
                    'amount' => $amount,
                    'gram_weight' => round($gramWeight, 2)
                ];
            } else {
                error_log("DEBUG: Skipping portion - gramWeight: $gramWeight, description: " . ($description ?? 'NULL'));
            }
        }
        
        error_log("Extracted " . count($extracted) . " food portions");
        return $extracted;
    }
    
    /**
     * Make HTTP request to USDA API
     */
    private function makeRequest($url, $params = [])
    {
        $queryString = http_build_query($params);
        $fullUrl = $url . '?' . $queryString;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            error_log("USDA API Error: " . $error);
            return null;
        }
        
        if ($httpCode !== 200) {
            error_log("USDA API returned status code: " . $httpCode);
            return null;
        }
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("USDA API JSON decode error: " . json_last_error_msg());
            return null;
        }
        
        return $decoded;
    }
    
    /**
     * Get popular food suggestions
     */
    public function getPopularFoods()
    {
        $popularSearches = ['chicken breast', 'rice', 'banana', 'egg', 'milk'];
        $results = [];
        
        foreach ($popularSearches as $search) {
            $foods = $this->searchFoods($search, 3);
            $results = array_merge($results, $foods);
        }
        
        return $results;
    }
}
