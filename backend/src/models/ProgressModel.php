<?php

/**
 * ProgressModel Class
 * 
 * Handles all database operations for progress tracking including:
 * - Managing body measurements and weight tracking
 * - Personal records and achievements
 * - Progress trends and statistics
 */

require_once '../config/Database.php';

class ProgressModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Get user's body measurements
     */
    public function getBodyMeasurements($userId, $limit = 30)
    {
        try {
            $query = "SELECT 
                        id,
                        measurement_date,
                        weight_kg,
                        body_fat_percentage,
                        muscle_mass_kg,
                        created_at
                      FROM body_measurements
                      WHERE user_id = ?
                      ORDER BY measurement_date DESC, created_at DESC
                      LIMIT ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("ii", $userId, $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $measurements = [];
            while ($row = $result->fetch_assoc()) {
                $measurements[] = $row;
            }
            
            return $measurements;

        } catch (Exception $e) {
            error_log("Error in getBodyMeasurements: " . $e->getMessage());
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
     * Add new body measurement
     */
    public function addBodyMeasurement($userId, $weight, $bodyFat = null, $muscleMass = null)
    {
        try {
            $query = "INSERT INTO body_measurements (user_id, measurement_date, weight_kg, body_fat_percentage, muscle_mass_kg, created_at) 
                      VALUES (?, CURDATE(), ?, ?, ?, NOW())";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("iddd", $userId, $weight, $bodyFat, $muscleMass);
            $result = $stmt->execute();
            
            return $result;

        } catch (Exception $e) {
            error_log("Error in addBodyMeasurement: " . $e->getMessage());
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
                $stmt->bind_param("dssisss", $value, $unit, $improvement, $userId, $exerciseName, $recordType);
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
     * Calculate progress trends
     */
    public function calculateProgressTrends($userId)
    {
        try {
            $trends = [
                'weightTrend' => null,
                'bodyFatTrend' => null,
                'muscleMassTrend' => null,
                'recentRecords' => 0
            ];

            // Get weight trend (last 2 measurements)
            $weightQuery = "SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY measurement_date DESC, created_at DESC LIMIT 2";
            $weightStmt = $this->conn->prepare($weightQuery);
            $weightStmt->bind_param("i", $userId);
            $weightStmt->execute();
            $weightResult = $weightStmt->get_result();
            
            $weights = [];
            while ($row = $weightResult->fetch_assoc()) {
                $weights[] = $row['weight_kg'];
            }
            
            if (count($weights) >= 2) {
                $trends['weightTrend'] = $weights[0] - $weights[1]; // Current - Previous
            }

            // Get body fat trend
            $bodyFatQuery = "SELECT body_fat_percentage FROM body_measurements WHERE user_id = ? AND body_fat_percentage IS NOT NULL ORDER BY measurement_date DESC LIMIT 2";
            $bodyFatStmt = $this->conn->prepare($bodyFatQuery);
            $bodyFatStmt->bind_param("i", $userId);
            $bodyFatStmt->execute();
            $bodyFatResult = $bodyFatStmt->get_result();
            
            $bodyFats = [];
            while ($row = $bodyFatResult->fetch_assoc()) {
                $bodyFats[] = $row['body_fat_percentage'];
            }
            
            if (count($bodyFats) >= 2) {
                $trends['bodyFatTrend'] = $bodyFats[0] - $bodyFats[1];
            }

            // Get muscle mass trend
            $muscleQuery = "SELECT muscle_mass_kg FROM body_measurements WHERE user_id = ? AND muscle_mass_kg IS NOT NULL ORDER BY measurement_date DESC LIMIT 2";
            $muscleStmt = $this->conn->prepare($muscleQuery);
            $muscleStmt->bind_param("i", $userId);
            $muscleStmt->execute();
            $muscleResult = $muscleStmt->get_result();
            
            $muscles = [];
            while ($row = $muscleResult->fetch_assoc()) {
                $muscles[] = $row['muscle_mass_kg'];
            }
            
            if (count($muscles) >= 2) {
                $trends['muscleMassTrend'] = $muscles[0] - $muscles[1];
            }

            // Count recent records (last 30 days)
            $recordsQuery = "SELECT COUNT(*) as count FROM personal_records WHERE user_id = ? AND achieved_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            $recordsStmt = $this->conn->prepare($recordsQuery);
            $recordsStmt->bind_param("i", $userId);
            $recordsStmt->execute();
            $recordsResult = $recordsStmt->get_result();
            $recordsRow = $recordsResult->fetch_assoc();
            $trends['recentRecords'] = $recordsRow['count'];

            return $trends;

        } catch (Exception $e) {
            error_log("Error in calculateProgressTrends: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get progress summary for dashboard
     */
    public function getProgressSummary($userId)
    {
        try {
            $summary = [
                'totalMeasurements' => 0,
                'totalRecords' => 0,
                'latestWeight' => null,
                'latestBodyFat' => null,
                'recentRecordCount' => 0
            ];

            // Count total measurements
            $measurementQuery = "SELECT COUNT(*) as count FROM body_measurements WHERE user_id = ?";
            $measurementStmt = $this->conn->prepare($measurementQuery);
            $measurementStmt->bind_param("i", $userId);
            $measurementStmt->execute();
            $measurementResult = $measurementStmt->get_result();
            $measurementRow = $measurementResult->fetch_assoc();
            $summary['totalMeasurements'] = $measurementRow['count'];

            // Count total records
            $recordQuery = "SELECT COUNT(*) as count FROM personal_records WHERE user_id = ?";
            $recordStmt = $this->conn->prepare($recordQuery);
            $recordStmt->bind_param("i", $userId);
            $recordStmt->execute();
            $recordResult = $recordStmt->get_result();
            $recordRow = $recordResult->fetch_assoc();
            $summary['totalRecords'] = $recordRow['count'];

            // Get latest measurements
            $latestQuery = "SELECT weight_kg, body_fat_percentage FROM body_measurements WHERE user_id = ? ORDER BY measurement_date DESC, created_at DESC LIMIT 1";
            $latestStmt = $this->conn->prepare($latestQuery);
            $latestStmt->bind_param("i", $userId);
            $latestStmt->execute();
            $latestResult = $latestStmt->get_result();
            
            if ($latestResult->num_rows > 0) {
                $latestRow = $latestResult->fetch_assoc();
                $summary['latestWeight'] = $latestRow['weight_kg'];
                $summary['latestBodyFat'] = $latestRow['body_fat_percentage'];
            }

            // Count recent records (last 30 days)
            $recentQuery = "SELECT COUNT(*) as count FROM personal_records WHERE user_id = ? AND achieved_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            $recentStmt = $this->conn->prepare($recentQuery);
            $recentStmt->bind_param("i", $userId);
            $recentStmt->execute();
            $recentResult = $recentStmt->get_result();
            $recentRow = $recentResult->fetch_assoc();
            $summary['recentRecordCount'] = $recentRow['count'];

            return $summary;

        } catch (Exception $e) {
            error_log("Error in getProgressSummary: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete body measurement
     */
    public function deleteBodyMeasurement($userId, $measurementId)
    {
        try {
            $query = "DELETE FROM body_measurements WHERE id = ? AND user_id = ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("ii", $measurementId, $userId);
            $result = $stmt->execute();
            
            return $result && $stmt->affected_rows > 0;

        } catch (Exception $e) {
            error_log("Error in deleteBodyMeasurement: " . $e->getMessage());
            throw $e;
        }
    }
}
