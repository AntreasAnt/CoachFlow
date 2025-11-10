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
     * @return array Search results
     */
    public function searchFoods($query, $pageSize = 20, $dataTypes = [])
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
            return $this->formatSearchResults($response['foods']);
        }
        
        return [];
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
                'nutrients' => $this->extractNutrients($food['foodNutrients'] ?? [])
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
