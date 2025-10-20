<?php
if (!defined(constant_name: 'APP_RUNNING')) exit('No direct script access');

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
                // Get exercises for this plan
                $exerciseQuery = "SELECT 
                                    wpe.exercise_id,
                                    wpe.sets,
                                    wpe.reps,
                                    wpe.duration_seconds,
                                    wpe.rest_seconds,
                                    wpe.notes,
                                    wpe.order_index,
                                    e.name,
                                    e.category,
                                    e.muscle_group,
                                    e.equipment,
                                    e.instructions
                                  FROM workout_plan_exercises wpe
                                  JOIN exercises e ON wpe.exercise_id = e.id
                                  WHERE wpe.workout_plan_id = ?
                                  ORDER BY wpe.order_index ASC";
                
                $exerciseStmt = $this->conn->prepare($exerciseQuery);
                $exerciseStmt->bind_param("i", $row['id']);
                $exerciseStmt->execute();
                $exerciseResult = $exerciseStmt->get_result();
                
                $exercises = [];
                while ($exerciseRow = $exerciseResult->fetch_assoc()) {
                    $exercises[] = $exerciseRow;
                }
                
                $row['exercises'] = $exercises;
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

    /**
     * Get all exercises including user's custom exercises
     */
    public function getAllExercises($userId)
    {
        try {
            $query = "SELECT 
                        id,
                        name,
                        category,
                        muscle_group,
                        equipment,
                        instructions,
                        is_custom,
                        created_by_user_id
                      FROM exercises
                      WHERE is_custom = 0 OR created_by_user_id = ?
                      ORDER BY is_custom ASC, name ASC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $exercises = [];
            while ($row = $result->fetch_assoc()) {
                $exercises[] = $row;
            }
            
            return $exercises;

        } catch (Exception $e) {
            error_log("Error in getAllExercises: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a custom exercise
     */
    public function createCustomExercise($userId, $exerciseData)
    {
        try {
            $query = "INSERT INTO exercises (name, category, muscle_group, equipment, instructions, is_custom, created_by_user_id, created_at) 
                      VALUES (?, ?, ?, ?, ?, 1, ?, NOW())";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $name = $exerciseData['name'];
            $category = $exerciseData['category'] ?? 'strength';
            $muscle_group = $exerciseData['muscle_group'] ?? '';
            $equipment = $exerciseData['equipment'] ?? '';
            $instructions = $exerciseData['instructions'] ?? '';

            $stmt->bind_param("sssssi", $name, $category, $muscle_group, $equipment, $instructions, $userId);
            $result = $stmt->execute();
            
            if ($result) {
                return $this->conn->insert_id;
            }
            
            return false;

        } catch (Exception $e) {
            error_log("Error in createCustomExercise: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a workout plan
     */
    public function createWorkoutPlan($userId, $planData)
    {
        try {
            // Start transaction
            $this->conn->begin_transaction();

            // Insert workout plan
            $query = "INSERT INTO user_workout_plans (user_id, name, description, created_at) 
                      VALUES (?, ?, ?, NOW())";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $name = $planData['name'];
            $description = $planData['description'] ?? '';

            $stmt->bind_param("iss", $userId, $name, $description);
            $result = $stmt->execute();
            
            if (!$result) {
                throw new Exception("Failed to create workout plan");
            }

            $planId = $this->conn->insert_id;

            // Insert exercises for the plan
            if (isset($planData['exercises']) && is_array($planData['exercises'])) {
                $exerciseQuery = "INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, duration_seconds, rest_seconds, notes, order_index) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                
                $exerciseStmt = $this->conn->prepare($exerciseQuery);
                if (!$exerciseStmt) {
                    throw new Exception("Prepare failed for exercises: " . $this->conn->error);
                }

                foreach ($planData['exercises'] as $index => $exercise) {
                    $exerciseId = $exercise['exercise_id'] ?? null;
                    $sets = $exercise['sets'] ?? 3;
                    $reps = $exercise['reps'] ?? '';
                    $duration = $exercise['duration_seconds'] ?? null;
                    $restSeconds = $exercise['rest_seconds'] ?? 60;
                    $notes = $exercise['notes'] ?? '';
                    $orderIndex = $index + 1;

                    if ($exerciseId) {
                        $exerciseStmt->bind_param("iiisissi", $planId, $exerciseId, $sets, $reps, $duration, $restSeconds, $notes, $orderIndex);
                        $exerciseStmt->execute();
                    }
                }
            }

            // Commit transaction
            $this->conn->commit();
            return $planId;

        } catch (Exception $e) {
            // Rollback transaction
            $this->conn->rollback();
            error_log("Error in createWorkoutPlan: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update a workout plan
     */
    public function updateWorkoutPlan($userId, $planData)
    {
        try {
            // Verify plan ownership
            $checkQuery = "SELECT id FROM user_workout_plans WHERE id = ? AND user_id = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("ii", $planData['id'], $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows === 0) {
                throw new Exception("Workout plan not found or access denied");
            }

            // Update plan
            $query = "UPDATE user_workout_plans SET name = ?, description = ? WHERE id = ? AND user_id = ?";
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $name = $planData['name'];
            $description = $planData['description'] ?? '';

            $stmt->bind_param("ssii", $name, $description, $planData['id'], $userId);
            $result = $stmt->execute();
            
            return $result;

        } catch (Exception $e) {
            error_log("Error in updateWorkoutPlan: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete a workout plan
     */
    public function deleteWorkoutPlan($userId, $planId)
    {
        try {
            // Start transaction
            $this->conn->begin_transaction();

            // Verify plan ownership
            $checkQuery = "SELECT id FROM user_workout_plans WHERE id = ? AND user_id = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("ii", $planId, $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows === 0) {
                throw new Exception("Workout plan not found or access denied");
            }

            // Delete related exercises first
            $deleteExercisesQuery = "DELETE FROM workout_plan_exercises WHERE workout_plan_id = ?";
            $deleteExercisesStmt = $this->conn->prepare($deleteExercisesQuery);
            $deleteExercisesStmt->bind_param("i", $planId);
            $deleteExercisesStmt->execute();

            // Delete the plan
            $deletePlanQuery = "DELETE FROM user_workout_plans WHERE id = ? AND user_id = ?";
            $deletePlanStmt = $this->conn->prepare($deletePlanQuery);
            $deletePlanStmt->bind_param("ii", $planId, $userId);
            $result = $deletePlanStmt->execute();

            // Commit transaction
            $this->conn->commit();
            return $result;

        } catch (Exception $e) {
            // Rollback transaction
            $this->conn->rollback();
            error_log("Error in deleteWorkoutPlan: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get workout details for a specific session
     */
    public function getWorkoutDetails($userId, $sessionId)
    {
        try {
            // Get session details
            $sessionQuery = "SELECT 
                               ws.id,
                               ws.workout_plan_id,
                               ws.plan_name,
                               ws.session_date,
                               ws.duration_minutes,
                               ws.rating,
                               COUNT(wel.id) as total_sets
                             FROM workout_sessions ws
                             LEFT JOIN workout_exercise_logs wel ON ws.id = wel.workout_session_id
                             WHERE ws.id = ? AND ws.user_id = ?
                             GROUP BY ws.id";

            $sessionStmt = $this->conn->prepare($sessionQuery);
            if (!$sessionStmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $sessionStmt->bind_param("ii", $sessionId, $userId);
            $sessionStmt->execute();
            $sessionResult = $sessionStmt->get_result();

            if ($sessionResult->num_rows === 0) {
                throw new Exception("Workout session not found");
            }

            $sessionData = $sessionResult->fetch_assoc();

            // Get exercise logs
            $logsQuery = "SELECT 
                            wel.exercise_name,
                            wel.set_number,
                            wel.reps_completed,
                            wel.weight_kg,
                            wel.rpe,
                            wel.notes
                          FROM workout_exercise_logs wel
                          WHERE wel.workout_session_id = ?
                          ORDER BY wel.id ASC";

            $logsStmt = $this->conn->prepare($logsQuery);
            $logsStmt->bind_param("i", $sessionId);
            $logsStmt->execute();
            $logsResult = $logsStmt->get_result();

            $exerciseLogs = [];
            while ($row = $logsResult->fetch_assoc()) {
                $exerciseLogs[] = $row;
            }

            $sessionData['exerciseLogs'] = $exerciseLogs;
            return $sessionData;

        } catch (Exception $e) {
            error_log("Error in getWorkoutDetails: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Save workout exercise logs
     */
    public function saveWorkoutLogs($userId, $sessionId, $logs)
    {
        try {
            // Verify session ownership
            $checkQuery = "SELECT id FROM workout_sessions WHERE id = ? AND user_id = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("ii", $sessionId, $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();

            if ($checkResult->num_rows === 0) {
                throw new Exception("Workout session not found or access denied");
            }

            // Start transaction
            $this->conn->begin_transaction();

            // Insert exercise logs
            $query = "INSERT INTO workout_exercise_logs (workout_session_id, exercise_name, set_number, reps_completed, weight_kg, rpe, notes, completed_at) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            foreach ($logs as $log) {
                $exerciseName = $log['exerciseName'];
                $setNumber = $log['setNumber'];
                $reps = $log['reps'];
                $weight = $log['weight'] ?? null;
                $rpe = $log['rpe'] ?? null;
                $notes = $log['notes'] ?? null;

                $stmt->bind_param("isiidis", $sessionId, $exerciseName, $setNumber, $reps, $weight, $rpe, $notes);
                $stmt->execute();
            }

            // Commit transaction
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Rollback transaction
            $this->conn->rollback();
            error_log("Error in saveWorkoutLogs: " . $e->getMessage());
            throw $e;
        }
    }
}
