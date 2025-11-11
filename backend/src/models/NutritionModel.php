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

    // ========== NEW METHODS FOR ENHANCED NUTRITION TRACKING ==========

    /**
     * Get user's active nutrition goal
     */
    public function getActiveGoal($userId)
    {
        $query = "SELECT * FROM nutrition_goals 
                  WHERE user_id = ? AND is_active = 1 
                  ORDER BY created_at DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc();
    }

    /**
     * Set nutrition goal (new table structure)
     */
    public function setNutritionGoal($userId, $goalData)
    {
        // First, deactivate all existing goals for this user
        $deactivateQuery = "UPDATE nutrition_goals SET is_active = 0 WHERE user_id = ?";
        $stmt = $this->conn->prepare($deactivateQuery);
        $stmt->bind_param("i", $userId);
        $stmt->execute();

        // Insert new goal
        $query = "INSERT INTO nutrition_goals 
                  (user_id, goal_type, target_calories, target_protein, target_carbs, target_fat, is_active) 
                  VALUES (?, ?, ?, ?, ?, ?, 1)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param(
            "isiddd",
            $userId,
            $goalData['goal_type'],
            $goalData['target_calories'],
            $goalData['target_protein'],
            $goalData['target_carbs'],
            $goalData['target_fat']
        );
        
        if ($stmt->execute()) {
            return $this->conn->insert_id;
        }
        
        return false;
    }

    /**
     * Get custom foods count for a user
     */
    public function getCustomFoodsCount($userId)
    {
        $query = "SELECT COUNT(*) as count FROM custom_foods WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        return (int)$row['count'];
    }

    /**
     * Get all custom foods for a user
     */
    public function getCustomFoods($userId, $limit = 50, $offset = 0)
    {
        $query = "SELECT * FROM custom_foods 
                  WHERE user_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iii", $userId, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Create custom food (max 50 per user)
     */
    public function createCustomFood($userId, $foodData)
    {
        // Check if user has reached the limit
        if ($this->getCustomFoodsCount($userId) >= 50) {
            return ['success' => false, 'error' => 'Maximum custom foods limit (50) reached. Please delete an existing food first.'];
        }

        $query = "INSERT INTO custom_foods 
                  (user_id, name, brand_name, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium, notes) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param(
            "isssdddddddds",
            $userId,
            $foodData['name'],
            $foodData['brand_name'],
            $foodData['serving_size'],
            $foodData['serving_unit'],
            $foodData['calories'],
            $foodData['protein'],
            $foodData['carbs'],
            $foodData['fat'],
            $foodData['fiber'],
            $foodData['sugar'],
            $foodData['sodium'],
            $foodData['notes']
        );
        
        if ($stmt->execute()) {
            return ['success' => true, 'id' => $this->conn->insert_id];
        }
        
        return ['success' => false, 'error' => 'Failed to create custom food'];
    }

    /**
     * Update custom food
     */
    public function updateCustomFood($userId, $foodId, $foodData)
    {
        $query = "UPDATE custom_foods 
                  SET name = ?, brand_name = ?, serving_size = ?, serving_unit = ?, 
                      calories = ?, protein = ?, carbs = ?, fat = ?, 
                      fiber = ?, sugar = ?, sodium = ?, notes = ?
                  WHERE id = ? AND user_id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param(
            "sssddddddddsii",
            $foodData['name'],
            $foodData['brand_name'],
            $foodData['serving_size'],
            $foodData['serving_unit'],
            $foodData['calories'],
            $foodData['protein'],
            $foodData['carbs'],
            $foodData['fat'],
            $foodData['fiber'],
            $foodData['sugar'],
            $foodData['sodium'],
            $foodData['notes'],
            $foodId,
            $userId
        );
        
        return $stmt->execute();
    }

    /**
     * Delete custom food
     */
    public function deleteCustomFood($userId, $foodId)
    {
        $query = "DELETE FROM custom_foods WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $foodId, $userId);
        
        return $stmt->execute();
    }

    /**
     * Log food entry (new table structure)
     */
    public function logFood($userId, $logData)
    {
        $query = "INSERT INTO food_logs 
                  (user_id, log_date, meal_type, food_source, food_id, food_name, 
                   serving_size, serving_unit, quantity, calories, protein, carbs, fat, 
                   fiber, sugar, sodium, notes) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        // Set defaults for optional fields
        $fiber = $logData['fiber'] ?? 0;
        $sugar = $logData['sugar'] ?? 0;
        $sodium = $logData['sodium'] ?? 0;
        $notes = $logData['notes'] ?? '';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param(
            "isssssdsdddddddds",  // i=int, s=string, d=double (17 params total)
            $userId,              // 1: i - int
            $logData['log_date'],       // 2: s - string (date)
            $logData['meal_type'],      // 3: s - string
            $logData['food_source'],    // 4: s - string
            $logData['food_id'],        // 5: s - string (fdc_id or custom id)
            $logData['food_name'],      // 6: s - string
            $logData['serving_size'],   // 7: d - double
            $logData['serving_unit'],   // 8: s - string
            $logData['quantity'],       // 9: d - double
            $logData['calories'],       // 10: d - double
            $logData['protein'],        // 11: d - double
            $logData['carbs'],          // 12: d - double
            $logData['fat'],            // 13: d - double
            $fiber,                     // 14: d - double
            $sugar,                     // 15: d - double
            $sodium,                    // 16: d - double
            $notes                      // 17: s - string
        );
        
        if ($stmt->execute()) {
            $logId = $this->conn->insert_id;
            // Update daily summary
            $this->updateDailySummary($userId, $logData['log_date']);
            return $logId;
        }
        
        return false;
    }

    /**
     * Get food logs for a date range
     */
    public function getFoodLogs($userId, $startDate, $endDate, $mealType = null)
    {
        $query = "SELECT * FROM food_logs 
                  WHERE user_id = ? AND log_date BETWEEN ? AND ?";
        
        if ($mealType) {
            $query .= " AND meal_type = ?";
        }
        
        $query .= " ORDER BY log_date DESC, created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        
        if ($mealType) {
            $stmt->bind_param("isss", $userId, $startDate, $endDate, $mealType);
        } else {
            $stmt->bind_param("iss", $userId, $startDate, $endDate);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Update food log entry
     */
    public function updateFoodLog($userId, $logId, $logData)
    {
        $query = "UPDATE food_logs 
                  SET meal_type = ?, quantity = ?, calories = ?, protein = ?, 
                      carbs = ?, fat = ?, fiber = ?, sugar = ?, sodium = ?, notes = ?
                  WHERE id = ? AND user_id = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param(
            "sddddddddsii",
            $logData['meal_type'],
            $logData['quantity'],
            $logData['calories'],
            $logData['protein'],
            $logData['carbs'],
            $logData['fat'],
            $logData['fiber'],
            $logData['sugar'],
            $logData['sodium'],
            $logData['notes'],
            $logId,
            $userId
        );
        
        if ($stmt->execute()) {
            // Get the log date to update summary
            $dateQuery = "SELECT log_date FROM food_logs WHERE id = ?";
            $dateStmt = $this->conn->prepare($dateQuery);
            $dateStmt->bind_param("i", $logId);
            $dateStmt->execute();
            $dateResult = $dateStmt->get_result();
            $dateRow = $dateResult->fetch_assoc();
            
            if ($dateRow) {
                $this->updateDailySummary($userId, $dateRow['log_date']);
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Delete food log entry
     */
    public function deleteFoodLog($userId, $logId)
    {
        // Get the log date before deleting
        $dateQuery = "SELECT log_date FROM food_logs WHERE id = ? AND user_id = ?";
        $dateStmt = $this->conn->prepare($dateQuery);
        $dateStmt->bind_param("ii", $logId, $userId);
        $dateStmt->execute();
        $dateResult = $dateStmt->get_result();
        $dateRow = $dateResult->fetch_assoc();
        
        $query = "DELETE FROM food_logs WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $logId, $userId);
        
        if ($stmt->execute() && $dateRow) {
            $this->updateDailySummary($userId, $dateRow['log_date']);
            return true;
        }
        
        return false;
    }

    /**
     * Update daily nutrition summary
     */
    private function updateDailySummary($userId, $date)
    {
        // Calculate totals for the day
        $query = "SELECT 
                    COALESCE(SUM(calories), 0) as total_calories,
                    COALESCE(SUM(protein), 0) as total_protein,
                    COALESCE(SUM(carbs), 0) as total_carbs,
                    COALESCE(SUM(fat), 0) as total_fat,
                    COALESCE(SUM(fiber), 0) as total_fiber,
                    COALESCE(SUM(sugar), 0) as total_sugar,
                    COALESCE(SUM(sodium), 0) as total_sodium,
                    COUNT(*) as meal_count
                  FROM food_logs 
                  WHERE user_id = ? AND log_date = ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("is", $userId, $date);
        $stmt->execute();
        $result = $stmt->get_result();
        $totals = $result->fetch_assoc();
        
        // Insert or update summary
        $upsertQuery = "INSERT INTO daily_nutrition_summary 
                        (user_id, summary_date, total_calories, total_protein, total_carbs, 
                         total_fat, total_fiber, total_sugar, total_sodium, meal_count) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        total_calories = VALUES(total_calories),
                        total_protein = VALUES(total_protein),
                        total_carbs = VALUES(total_carbs),
                        total_fat = VALUES(total_fat),
                        total_fiber = VALUES(total_fiber),
                        total_sugar = VALUES(total_sugar),
                        total_sodium = VALUES(total_sodium),
                        meal_count = VALUES(meal_count)";
        
        $upsertStmt = $this->conn->prepare($upsertQuery);
        $upsertStmt->bind_param(
            "isdddddddi",
            $userId,
            $date,
            $totals['total_calories'],
            $totals['total_protein'],
            $totals['total_carbs'],
            $totals['total_fat'],
            $totals['total_fiber'],
            $totals['total_sugar'],
            $totals['total_sodium'],
            $totals['meal_count']
        );
        
        return $upsertStmt->execute();
    }

    /**
     * Get daily summaries for a date range
     */
    public function getDailySummaries($userId, $startDate, $endDate)
    {
        $query = "SELECT * FROM daily_nutrition_summary 
                  WHERE user_id = ? AND summary_date BETWEEN ? AND ?
                  ORDER BY summary_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iss", $userId, $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Cache USDA food data
     */
    public function cacheUSDAFood($foodData)
    {
        $query = "INSERT INTO usda_foods 
                  (fdc_id, description, brand_name, data_type, serving_size, serving_unit, 
                   calories, protein, carbs, fat, fiber, sugar, sodium, api_data) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE 
                  description = VALUES(description),
                  brand_name = VALUES(brand_name),
                  calories = VALUES(calories),
                  protein = VALUES(protein),
                  carbs = VALUES(carbs),
                  fat = VALUES(fat),
                  fiber = VALUES(fiber),
                  sugar = VALUES(sugar),
                  sodium = VALUES(sodium),
                  api_data = VALUES(api_data)";
        
        $apiDataJson = json_encode($foodData['api_data']);
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param(
            "sssssdddddddds",
            $foodData['fdc_id'],
            $foodData['description'],
            $foodData['brand_name'],
            $foodData['data_type'],
            $foodData['serving_size'],
            $foodData['serving_unit'],
            $foodData['calories'],
            $foodData['protein'],
            $foodData['carbs'],
            $foodData['fat'],
            $foodData['fiber'],
            $foodData['sugar'],
            $foodData['sodium'],
            $apiDataJson
        );
        
        return $stmt->execute();
    }

    /**
     * Get cached USDA food by FDC ID
     */
    public function getCachedUSDAFood($fdcId)
    {
        $query = "SELECT * FROM usda_foods WHERE fdc_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $fdcId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc();
    }

    /**
     * Search cached USDA foods
     */
    public function searchCachedUSDAFoods($searchTerm, $limit = 20)
    {
        $searchPattern = "%{$searchTerm}%";
        $query = "SELECT * FROM usda_foods 
                  WHERE description LIKE ? OR brand_name LIKE ?
                  ORDER BY description ASC 
                  LIMIT ?";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ssi", $searchPattern, $searchPattern, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
