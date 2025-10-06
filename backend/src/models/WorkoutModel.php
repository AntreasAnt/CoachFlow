<?php

/**
 * WorkoutModel Class
 * 
 * Handles all database operations for workouts including:
 * - Managing user workout plans and sessions
 * - Getting premium workout plans
 * - Tracking personal records and progress
 */

require_once '../config/Database.php';

class WorkoutModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Get user's workout plans
     */
    public function getUserWorkoutPlans($userId)
    {
        try {
            $query = "SELECT 
                        id,
                        name,
                        description,
                        last_performed,
                        created_at
                      FROM user_workout_plans
                      WHERE user_id = ?
                      ORDER BY last_performed DESC, created_at DESC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $plans = [];
            while ($row = $result->fetch_assoc()) {
                $plans[] = $row;
            }
            
            return $plans;

        } catch (Exception $e) {
            error_log("Error in getUserWorkoutPlans: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get recent workout sessions
     */
    public function getRecentSessions($userId, $limit = 10)
    {
        try {
            $query = "SELECT 
                        id,
                        workout_plan_id,
                        plan_name,
                        session_date,
                        duration_minutes,
                        rating,
                        created_at
                      FROM workout_sessions
                      WHERE user_id = ?
                      ORDER BY session_date DESC, created_at DESC
                      LIMIT ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("ii", $userId, $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $sessions = [];
            while ($row = $result->fetch_assoc()) {
                $sessions[] = $row;
            }
            
            return $sessions;

        } catch (Exception $e) {
            error_log("Error in getRecentSessions: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get premium workout plans
     */
    public function getPremiumPlans()
    {
        try {
            $query = "SELECT 
                        p.id,
                        p.title,
                        p.description,
                        p.price,
                        p.duration_weeks,
                        p.difficulty_level,
                        p.category,
                        p.average_rating,
                        p.total_purchases,
                        u.username as trainer_name
                      FROM premium_workout_plans p
                      JOIN user u ON p.created_by_trainer_id = u.userid
                      ORDER BY p.average_rating DESC, p.total_purchases DESC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            
            $plans = [];
            while ($row = $result->fetch_assoc()) {
                $plans[] = $row;
            }
            
            return $plans;

        } catch (Exception $e) {
            error_log("Error in getPremiumPlans: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get user's personal records
     */
    public function getPersonalRecords($userId)
    {
        try {
            $query = "SELECT 
                        exercise_name,
                        record_type,
                        value,
                        unit,
                        achieved_date,
                        improvement
                      FROM personal_records
                      WHERE user_id = ?
                      ORDER BY achieved_date DESC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $records = [];
            while ($row = $result->fetch_assoc()) {
                $records[] = $row;
            }
            
            return $records;

        } catch (Exception $e) {
            error_log("Error in getPersonalRecords: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a new workout session
     */
    public function createWorkoutSession($userId, $workoutPlanId, $planName, $duration, $rating = null)
    {
        try {
            $query = "INSERT INTO workout_sessions (user_id, workout_plan_id, plan_name, session_date, duration_minutes, rating, created_at) 
                      VALUES (?, ?, ?, CURDATE(), ?, ?, NOW())";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("iisii", $userId, $workoutPlanId, $planName, $duration, $rating);
            $result = $stmt->execute();
            
            if ($result) {
                return $this->conn->insert_id;
            }
            
            return false;

        } catch (Exception $e) {
            error_log("Error in createWorkoutSession: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update or insert personal record
     */
    public function updatePersonalRecord($userId, $exerciseName, $recordType, $value, $unit, $improvement = null)
    {
        try {
            // Check if record exists
            $checkQuery = "SELECT id FROM personal_records WHERE user_id = ? AND exercise_name = ? AND record_type = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("iss", $userId, $exerciseName, $recordType);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows > 0) {
                // Update existing record
                $query = "UPDATE personal_records SET value = ?, unit = ?, achieved_date = CURDATE(), improvement = ? 
                          WHERE user_id = ? AND exercise_name = ? AND record_type = ?";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("dssiss", $value, $unit, $improvement, $userId, $exerciseName, $recordType);
            } else {
                // Insert new record
                $query = "INSERT INTO personal_records (user_id, exercise_name, record_type, value, unit, achieved_date, improvement) 
                          VALUES (?, ?, ?, ?, ?, CURDATE(), ?)";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("issdss", $userId, $exerciseName, $recordType, $value, $unit, $improvement);
            }

            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $result = $stmt->execute();
            return $result;

        } catch (Exception $e) {
            error_log("Error in updatePersonalRecord: " . $e->getMessage());
            throw $e;
        }
    }
}
