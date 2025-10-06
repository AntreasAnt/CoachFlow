<?php

/**
 * NutritionController Class
 * 
 * Handles all nutrition-related business logic including:
 * - Getting user meal data and nutrition goals
 * - Managing food logging
 * - Calculating nutrition totals and progress
 */

require_once '../models/NutritionModel.php';
require_once '../config/Auth.php';

class NutritionController
{
    private $nutritionModel;

    public function __construct()
    {
        $this->nutritionModel = new NutritionModel();
    }

    /**
     * Get today's meals and nutrition data
     */
    public function getTodaysMeals($userId)
    {
        try {
            // Validate user authentication
            if (!$userId) {
                throw new Exception('User ID is required');
            }

            $response = [
                'success' => true,
                'meals' => [
                    'breakfast' => [],
                    'lunch' => [],
                    'dinner' => [],
                    'snacks' => []
                ],
                'nutritionGoals' => null,
                'totalNutrition' => [
                    'calories' => 0,
                    'protein' => 0,
                    'carbs' => 0,
                    'fat' => 0
                ]
            ];

            // Get today's meals grouped by meal type
            $meals = $this->nutritionModel->getTodaysMeals($userId);
            
            // Group meals by type
            foreach ($meals as $meal) {
                $mealType = $meal['meal_type'];
                if (isset($response['meals'][$mealType])) {
                    $response['meals'][$mealType][] = $meal;
                }
            }

            // Get nutrition goals
            $nutritionGoals = $this->nutritionModel->getNutritionGoals($userId);
            $response['nutritionGoals'] = $nutritionGoals;

            // Calculate total nutrition for today
            $totalNutrition = $this->nutritionModel->getTotalNutritionForDate($userId, date('Y-m-d'));
            $response['totalNutrition'] = $totalNutrition;

            return $response;

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Log a meal
     */
    public function logMeal($userId, $foodId, $mealType, $quantityGrams)
    {
        try {
            // Validate input
            if (!$userId || !$foodId || !$mealType || !$quantityGrams) {
                throw new Exception('All fields are required');
            }

            // Validate meal type
            $validMealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
            if (!in_array($mealType, $validMealTypes)) {
                throw new Exception('Invalid meal type');
            }

            $result = $this->nutritionModel->logMeal($userId, $foodId, $mealType, $quantityGrams);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Meal logged successfully'
                ];
            } else {
                throw new Exception('Failed to log meal');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Search foods
     */
    public function searchFoods($searchTerm)
    {
        try {
            if (!$searchTerm) {
                throw new Exception('Search term is required');
            }

            $foods = $this->nutritionModel->searchFoods($searchTerm);
            
            return [
                'success' => true,
                'foods' => $foods
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Update nutrition goals
     */
    public function updateNutritionGoals($userId, $dailyCalories, $dailyProtein, $dailyCarbs, $dailyFat)
    {
        try {
            // Validate input
            if (!$userId || !$dailyCalories || !$dailyProtein || !$dailyCarbs || !$dailyFat) {
                throw new Exception('All nutrition goal fields are required');
            }

            $result = $this->nutritionModel->updateNutritionGoals($userId, $dailyCalories, $dailyProtein, $dailyCarbs, $dailyFat);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Nutrition goals updated successfully'
                ];
            } else {
                throw new Exception('Failed to update nutrition goals');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete meal log entry
     */
    public function deleteMealEntry($userId, $mealLogId)
    {
        try {
            // Validate input
            if (!$userId || !$mealLogId) {
                throw new Exception('User ID and meal log ID are required');
            }

            $result = $this->nutritionModel->deleteMealEntry($userId, $mealLogId);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Meal entry deleted successfully'
                ];
            } else {
                throw new Exception('Failed to delete meal entry');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
