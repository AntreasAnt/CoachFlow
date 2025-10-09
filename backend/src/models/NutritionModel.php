<?php
if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * NutritionModel Class
 * 
 * Handles all database operations for nutrition including:
 * - Managing meal logs and food data
 * - Calculating nutrition totals and goals
 * - Food search and management
 */

require_once '../config/Database.php';


class NutritionModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Get today's meals for a user
     */
    public function getTodaysMeals($userId)
    {
        try {
            $today = date('Y-m-d');
            
            $query = "SELECT 
                        ml.id as log_id,
                        ml.meal_type,
                        ml.quantity_grams,
                        ml.logged_time,
                        f.name as food_name,
                        f.brand,
                        f.calories_per_100g,
                        f.protein_per_100g,
                        f.carbs_per_100g,
                        f.fat_per_100g,
                        ROUND((f.calories_per_100g * ml.quantity_grams / 100), 1) as total_calories,
                        ROUND((f.protein_per_100g * ml.quantity_grams / 100), 1) as total_protein,
                        ROUND((f.carbs_per_100g * ml.quantity_grams / 100), 1) as total_carbs,
                        ROUND((f.fat_per_100g * ml.quantity_grams / 100), 1) as total_fat
                      FROM meal_logs ml
                      JOIN foods f ON ml.food_id = f.id
                      WHERE ml.user_id = ? AND ml.logged_date = ?
                      ORDER BY ml.logged_time ASC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("is", $userId, $today);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $meals = [];
            while ($row = $result->fetch_assoc()) {
                $meals[] = $row;
            }
            
            return $meals;

        } catch (Exception $e) {
            error_log("Error in getTodaysMeals: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get user's nutrition goals
     */
    public function getNutritionGoals($userId)
    {
        try {
            $query = "SELECT 
                        daily_calories,
                        daily_protein_g,
                        daily_carbs_g,
                        daily_fat_g
                      FROM user_nutrition_goals
                      WHERE user_id = ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                return $result->fetch_assoc();
            }
            
            return null;

        } catch (Exception $e) {
            error_log("Error in getNutritionGoals: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get total nutrition for a specific date
     */
    public function getTotalNutritionForDate($userId, $date)
    {
        try {
            $query = "SELECT 
                        ROUND(SUM(f.calories_per_100g * ml.quantity_grams / 100), 1) as total_calories,
                        ROUND(SUM(f.protein_per_100g * ml.quantity_grams / 100), 1) as total_protein,
                        ROUND(SUM(f.carbs_per_100g * ml.quantity_grams / 100), 1) as total_carbs,
                        ROUND(SUM(f.fat_per_100g * ml.quantity_grams / 100), 1) as total_fat
                      FROM meal_logs ml
                      JOIN foods f ON ml.food_id = f.id
                      WHERE ml.user_id = ? AND ml.logged_date = ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("is", $userId, $date);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $row = $result->fetch_assoc();
            
            return [
                'calories' => $row['total_calories'] ?? 0,
                'protein' => $row['total_protein'] ?? 0,
                'carbs' => $row['total_carbs'] ?? 0,
                'fat' => $row['total_fat'] ?? 0
            ];

        } catch (Exception $e) {
            error_log("Error in getTotalNutritionForDate: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Log a meal
     */
    public function logMeal($userId, $foodId, $mealType, $quantityGrams)
    {
        try {
            $query = "INSERT INTO meal_logs (user_id, food_id, meal_type, quantity_grams, logged_date, logged_time) 
                      VALUES (?, ?, ?, ?, CURDATE(), CURTIME())";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("iisd", $userId, $foodId, $mealType, $quantityGrams);
            $result = $stmt->execute();
            
            return $result;

        } catch (Exception $e) {
            error_log("Error in logMeal: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Search foods by name
     */
    public function searchFoods($searchTerm, $limit = 20)
    {
        try {
            $searchPattern = '%' . $searchTerm . '%';
            
            $query = "SELECT 
                        id,
                        name,
                        brand,
                        calories_per_100g,
                        protein_per_100g,
                        carbs_per_100g,
                        fat_per_100g,
                        is_verified
                      FROM foods
                      WHERE name LIKE ? OR brand LIKE ?
                      ORDER BY is_verified DESC, name ASC
                      LIMIT ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("ssi", $searchPattern, $searchPattern, $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $foods = [];
            while ($row = $result->fetch_assoc()) {
                $foods[] = $row;
            }
            
            return $foods;

        } catch (Exception $e) {
            error_log("Error in searchFoods: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update or insert nutrition goals
     */
    public function updateNutritionGoals($userId, $dailyCalories, $dailyProtein, $dailyCarbs, $dailyFat)
    {
        try {
            // Check if goals exist
            $checkQuery = "SELECT user_id FROM user_nutrition_goals WHERE user_id = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("i", $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows > 0) {
                // Update existing goals
                $query = "UPDATE user_nutrition_goals SET 
                          daily_calories = ?, daily_protein_g = ?, daily_carbs_g = ?, daily_fat_g = ?
                          WHERE user_id = ?";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("ddddi", $dailyCalories, $dailyProtein, $dailyCarbs, $dailyFat, $userId);
            } else {
                // Insert new goals
                $query = "INSERT INTO user_nutrition_goals (user_id, daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g) 
                          VALUES (?, ?, ?, ?, ?)";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("idddd", $userId, $dailyCalories, $dailyProtein, $dailyCarbs, $dailyFat);
            }

            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $result = $stmt->execute();
            return $result;

        } catch (Exception $e) {
            error_log("Error in updateNutritionGoals: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete a meal log entry
     */
    public function deleteMealEntry($userId, $mealLogId)
    {
        try {
            $query = "DELETE FROM meal_logs WHERE id = ? AND user_id = ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("ii", $mealLogId, $userId);
            $result = $stmt->execute();
            
            return $result && $stmt->affected_rows > 0;

        } catch (Exception $e) {
            error_log("Error in deleteMealEntry: " . $e->getMessage());
            throw $e;
        }
    }
}
