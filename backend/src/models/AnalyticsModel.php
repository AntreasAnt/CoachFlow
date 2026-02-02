<?php
if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * AnalyticsModel Class
 * 
 * Handles analytics calculations, achievement detection, and performance monitoring
 */

require_once '../config/Database.php';
require_once '../config/AchievementsConfig.php';

class AnalyticsModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Get comprehensive user analytics
     */
    public function getUserAnalytics($userId, $startDate = null, $endDate = null, $trainingPeriodId = null)
    {
        try {
            // Default to last 90 days if no dates provided
            if (!$startDate) {
                $startDate = date('Y-m-d', strtotime('-90 days'));
            }
            if (!$endDate) {
                $endDate = date('Y-m-d');
            }

            $analytics = [
                'overview' => $this->getOverviewStats($userId, $startDate, $endDate, $trainingPeriodId),
                'strength_progress' => $this->getStrengthProgress($userId, $startDate, $endDate, $trainingPeriodId),
                'volume_trends' => $this->getVolumeTrends($userId, $startDate, $endDate, $trainingPeriodId),
                'body_composition' => $this->getBodyComposition($userId, $startDate, $endDate),
                'consistency' => $this->getConsistencyStats($userId, $startDate, $endDate),
                'personal_records' => $this->getPersonalRecords($userId, $trainingPeriodId)
            ];

            return $analytics;

        } catch (Exception $e) {
            error_log("Error in getUserAnalytics: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get overview statistics
     */
    private function getOverviewStats($userId, $startDate, $endDate, $trainingPeriodId = null)
    {
        $periodCondition = $trainingPeriodId ? "AND ws.training_period_id = ?" : "";
        
        $query = "SELECT 
                    COUNT(DISTINCT ws.id) as total_workouts,
                    SUM(ws.duration_minutes) as total_minutes,
                    COUNT(DISTINCT wel.exercise_name) as unique_exercises,
                    SUM(wel.weight_kg * wel.reps_completed) as total_volume_kg,
                    SUM(wel.reps_completed) as total_reps,
                    COUNT(wel.id) as total_sets,
                    AVG(wel.rpe) as avg_rpe
                  FROM workout_sessions ws
                  LEFT JOIN workout_exercise_logs wel ON ws.id = wel.workout_session_id
                  WHERE ws.user_id = ?
                    AND ws.session_date BETWEEN ? AND ?
                    $periodCondition";

        $stmt = $this->conn->prepare($query);
        if ($trainingPeriodId) {
            $stmt->bind_param("issi", $userId, $startDate, $endDate, $trainingPeriodId);
        } else {
            $stmt->bind_param("iss", $userId, $startDate, $endDate);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    /**
     * Get strength progression (1RM estimates over time)
     */
    private function getStrengthProgress($userId, $startDate, $endDate, $trainingPeriodId = null)
    {
        $periodCondition = $trainingPeriodId ? "AND training_period_id = ?" : "";
        
        $query = "SELECT 
                    exercise_name,
                    recorded_date,
                    estimated_1rm,
                    based_on_weight,
                    based_on_reps,
                    calculation_method
                  FROM exercise_1rm_tracking
                  WHERE user_id = ?
                    AND recorded_date BETWEEN ? AND ?
                    $periodCondition
                  ORDER BY exercise_name, recorded_date";

        $stmt = $this->conn->prepare($query);
        if ($trainingPeriodId) {
            $stmt->bind_param("issi", $userId, $startDate, $endDate, $trainingPeriodId);
        } else {
            $stmt->bind_param("iss", $userId, $startDate, $endDate);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $progressByExercise = [];
        while ($row = $result->fetch_assoc()) {
            $exercise = $row['exercise_name'];
            if (!isset($progressByExercise[$exercise])) {
                $progressByExercise[$exercise] = [];
            }
            $progressByExercise[$exercise][] = $row;
        }
        
        return $progressByExercise;
    }

    /**
     * Get volume trends by week
     */
    private function getVolumeTrends($userId, $startDate, $endDate, $trainingPeriodId = null)
    {
        $periodCondition = $trainingPeriodId ? "AND training_period_id = ?" : "";
        
        $query = "SELECT 
                    week_start_date,
                    week_end_date,
                    total_workouts,
                    total_volume_kg,
                    total_reps,
                    total_sets,
                    avg_rpe,
                    total_duration_minutes,
                    unique_exercises
                  FROM weekly_volume_summary
                  WHERE user_id = ?
                    AND week_start_date >= ?
                    AND week_end_date <= ?
                    $periodCondition
                  ORDER BY week_start_date";

        $stmt = $this->conn->prepare($query);
        if ($trainingPeriodId) {
            $stmt->bind_param("issi", $userId, $startDate, $endDate, $trainingPeriodId);
        } else {
            $stmt->bind_param("iss", $userId, $startDate, $endDate);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $trends = [];
        while ($row = $result->fetch_assoc()) {
            $trends[] = $row;
        }
        
        return $trends;
    }

    /**
     * Get body composition data
     */
    private function getBodyComposition($userId, $startDate, $endDate)
    {
        $query = "SELECT 
                    measurement_date,
                    weight_kg,
                    body_fat_percentage,
                    muscle_mass_kg,
                    chest_cm,
                    waist_cm,
                    hips_cm,
                    bicep_left_cm,
                    bicep_right_cm,
                    thigh_left_cm,
                    thigh_right_cm
                  FROM body_measurements
                  WHERE user_id = ?
                    AND measurement_date BETWEEN ? AND ?
                  ORDER BY measurement_date";

        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iss", $userId, $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $measurements = [];
        while ($row = $result->fetch_assoc()) {
            $measurements[] = $row;
        }
        
        return $measurements;
    }

    /**
     * Get consistency statistics
     */
    private function getConsistencyStats($userId, $startDate, $endDate)
    {
        // Get streaks
        $streakQuery = "SELECT streak_type, current_streak, longest_streak, last_activity_date
                        FROM user_streaks
                        WHERE user_id = ?";
        
        $stmt = $this->conn->prepare($streakQuery);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $streaks = [];
        while ($row = $result->fetch_assoc()) {
            $streaks[$row['streak_type']] = $row;
        }

        // Get workout frequency by day of week
        $frequencyQuery = "SELECT 
                            DAYNAME(session_date) as day_name,
                            COUNT(*) as workout_count
                           FROM workout_sessions
                           WHERE user_id = ?
                             AND session_date BETWEEN ? AND ?
                           GROUP BY DAYNAME(session_date), DAYOFWEEK(session_date)
                           ORDER BY DAYOFWEEK(session_date)";
        
        $stmt = $this->conn->prepare($frequencyQuery);
        $stmt->bind_param("iss", $userId, $startDate, $endDate);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $frequency = [];
        while ($row = $result->fetch_assoc()) {
            $frequency[] = $row;
        }

        return [
            'streaks' => $streaks,
            'frequency_by_day' => $frequency
        ];
    }

    /**
     * Get personal records
     */
    private function getPersonalRecords($userId, $trainingPeriodId = null)
    {
        // Get top 1RM for each exercise
        $query = "SELECT 
                    e1.exercise_name,
                    e1.estimated_1rm as record_value,
                    e1.recorded_date as achieved_date,
                    e1.based_on_weight,
                    e1.based_on_reps,
                    ws.training_period_id
                  FROM exercise_1rm_tracking e1
                  INNER JOIN (
                    SELECT exercise_name, MAX(estimated_1rm) as max_1rm
                    FROM exercise_1rm_tracking
                    WHERE user_id = ?
                    GROUP BY exercise_name
                  ) e2 ON e1.exercise_name = e2.exercise_name AND e1.estimated_1rm = e2.max_1rm
                  LEFT JOIN workout_sessions ws ON e1.workout_session_id = ws.id
                  WHERE e1.user_id = ?";
        
        if ($trainingPeriodId) {
            $query .= " AND ws.training_period_id = ?";
        }
        
        $query .= " ORDER BY e1.recorded_date DESC";

        $stmt = $this->conn->prepare($query);
        if ($trainingPeriodId) {
            $stmt->bind_param("iii", $userId, $userId, $trainingPeriodId);
        } else {
            $stmt->bind_param("ii", $userId, $userId);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $records = [];
        while ($row = $result->fetch_assoc()) {
            $records[] = $row;
        }
        
        return $records;
    }

    /**
     * Calculate and store 1RM for a workout session
     */
    public function calculate1RMForWorkout($userId, $sessionId, $trainingPeriodId = null)
    {
        try {
            // Get user's bodyweight from the session
            $bodyweightQuery = "SELECT user_bodyweight_kg FROM workout_sessions WHERE id = ? AND user_id = ?";
            $stmt = $this->conn->prepare($bodyweightQuery);
            $stmt->bind_param("ii", $sessionId, $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $sessionData = $result->fetch_assoc();
            $userBodyweight = $sessionData['user_bodyweight_kg'];

            // Get all exercise logs for this session
            $logsQuery = "SELECT exercise_name, weight_kg, reps_completed
                          FROM workout_exercise_logs
                          WHERE workout_session_id = ?
                            AND weight_kg IS NOT NULL
                            AND reps_completed BETWEEN 1 AND 12
                          ORDER BY exercise_name, weight_kg DESC";
            
            $stmt = $this->conn->prepare($logsQuery);
            $stmt->bind_param("i", $sessionId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $exerciseMax = [];
            while ($row = $result->fetch_assoc()) {
                $exercise = $row['exercise_name'];
                $weight = $row['weight_kg'];
                $reps = $row['reps_completed'];
                
                $estimated1RM = AchievementsConfig::calculate1RM($weight, $reps, 'Epley');
                
                if (!isset($exerciseMax[$exercise]) || $estimated1RM > $exerciseMax[$exercise]['1rm']) {
                    $exerciseMax[$exercise] = [
                        '1rm' => $estimated1RM,
                        'weight' => $weight,
                        'reps' => $reps
                    ];
                }
            }
            
            // Insert 1RM records
            $insertQuery = "INSERT INTO exercise_1rm_tracking 
                            (user_id, exercise_name, estimated_1rm, calculation_method, based_on_weight, based_on_reps, workout_session_id, recorded_date)
                            VALUES (?, ?, ?, 'Epley', ?, ?, ?, CURDATE())";
            
            $stmt = $this->conn->prepare($insertQuery);
            
            foreach ($exerciseMax as $exercise => $data) {
                $stmt->bind_param("isddii", 
                    $userId, 
                    $exercise, 
                    $data['1rm'], 
                    $data['weight'], 
                    $data['reps'], 
                    $sessionId
                );
                $stmt->execute();
            }
            
            return count($exerciseMax);

        } catch (Exception $e) {
            error_log("Error in calculate1RMForWorkout: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update weekly volume summary
     */
    public function updateWeeklyVolumeSummary($userId, $date)
    {
        try {
            // Get week start (Monday) and end (Sunday)
            $timestamp = strtotime($date);
            $dayOfWeek = date('N', $timestamp); // 1 (Monday) to 7 (Sunday)
            $weekStart = date('Y-m-d', strtotime('-' . ($dayOfWeek - 1) . ' days', $timestamp));
            $weekEnd = date('Y-m-d', strtotime('+' . (7 - $dayOfWeek) . ' days', $timestamp));

            // Calculate weekly stats
            $query = "SELECT 
                        COUNT(DISTINCT ws.id) as total_workouts,
                        SUM(wel.weight_kg * wel.reps_completed) as total_volume_kg,
                        SUM(wel.reps_completed) as total_reps,
                        COUNT(wel.id) as total_sets,
                        AVG(wel.rpe) as avg_rpe,
                        SUM(ws.duration_minutes) as total_duration_minutes,
                        COUNT(DISTINCT wel.exercise_name) as unique_exercises,
                        ws.training_period_id
                      FROM workout_sessions ws
                      LEFT JOIN workout_exercise_logs wel ON ws.id = wel.workout_session_id
                      WHERE ws.user_id = ?
                        AND ws.session_date BETWEEN ? AND ?
                      GROUP BY ws.training_period_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("iss", $userId, $weekStart, $weekEnd);
            $stmt->execute();
            $result = $stmt->get_result();
            $stats = $result->fetch_assoc();

            if ($stats && $stats['total_workouts'] > 0) {
                // Insert or update weekly summary
                $upsertQuery = "INSERT INTO weekly_volume_summary 
                                (user_id, week_start_date, week_end_date, total_workouts, total_volume_kg, 
                                 total_reps, total_sets, avg_rpe, total_duration_minutes, unique_exercises, training_period_id)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                total_workouts = VALUES(total_workouts),
                                total_volume_kg = VALUES(total_volume_kg),
                                total_reps = VALUES(total_reps),
                                total_sets = VALUES(total_sets),
                                avg_rpe = VALUES(avg_rpe),
                                total_duration_minutes = VALUES(total_duration_minutes),
                                unique_exercises = VALUES(unique_exercises),
                                training_period_id = VALUES(training_period_id)";

                $stmt = $this->conn->prepare($upsertQuery);
                $stmt->bind_param("issidddiiii",
                    $userId,
                    $weekStart,
                    $weekEnd,
                    $stats['total_workouts'],
                    $stats['total_volume_kg'],
                    $stats['total_reps'],
                    $stats['total_sets'],
                    $stats['avg_rpe'],
                    $stats['total_duration_minutes'],
                    $stats['unique_exercises'],
                    $stats['training_period_id']
                );
                $stmt->execute();
            }

            return true;

        } catch (Exception $e) {
            error_log("Error in updateWeeklyVolumeSummary: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Detect and award achievements
     */
    public function detectAchievements($userId, $sessionId = null)
    {
        try {
            $newAchievements = [];
            $achievements = AchievementsConfig::getAchievements();

            // Get existing achievements
            $existingQuery = "SELECT achievement_name FROM user_achievements WHERE user_id = ?";
            $stmt = $this->conn->prepare($existingQuery);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $existing = [];
            while ($row = $result->fetch_assoc()) {
                $existing[] = $row['achievement_name'];
            }

            // Check each achievement type
            $newAchievements = array_merge(
                $newAchievements,
                $this->checkConsistencyAchievements($userId, $existing, $achievements),
                $this->checkVolumeAchievements($userId, $existing, $achievements),
                $this->checkStrengthAchievements($userId, $existing, $achievements),
                $this->checkBodyCompositionAchievements($userId, $existing, $achievements)
            );

            // Award new achievements
            if (count($newAchievements) > 0) {
                $insertQuery = "INSERT INTO user_achievements 
                                (user_id, achievement_type, achievement_name, description, icon, value, metadata)
                                VALUES (?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $this->conn->prepare($insertQuery);
                
                foreach ($newAchievements as $achievement) {
                    $metadata = json_encode($achievement['metadata'] ?? []);
                    $stmt->bind_param("issssss",
                        $userId,
                        $achievement['type'],
                        $achievement['name'],
                        $achievement['description'],
                        $achievement['icon'],
                        $achievement['value'],
                        $metadata
                    );
                    $stmt->execute();
                }
            }

            return $newAchievements;

        } catch (Exception $e) {
            error_log("Error in detectAchievements: " . $e->getMessage());
            throw $e;
        }
    }

    private function checkConsistencyAchievements($userId, $existing, $allAchievements)
    {
        $awarded = [];
        
        // Check total workouts
        $query = "SELECT COUNT(*) as total FROM workout_sessions WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $totalWorkouts = $data['total'];

        $milestones = [
            ['count' => 1, 'key' => 'first_workout'],
            ['count' => 50, 'key' => 'workouts_50'],
            ['count' => 100, 'key' => 'workouts_100'],
            ['count' => 500, 'key' => 'workouts_500']
        ];

        foreach ($milestones as $milestone) {
            if ($totalWorkouts >= $milestone['count'] && 
                !in_array($allAchievements[$milestone['key']]['name'], $existing)) {
                $awarded[] = array_merge($allAchievements[$milestone['key']], [
                    'value' => $milestone['count']
                ]);
            }
        }

        // Check streaks
        $streakQuery = "SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ? AND streak_type = 'workout_streak'";
        $stmt = $this->conn->prepare($streakQuery);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $streakData = $result->fetch_assoc();
            $longestStreak = max($streakData['current_streak'], $streakData['longest_streak']);

            $streakMilestones = [
                ['days' => 7, 'key' => 'streak_7_days'],
                ['days' => 30, 'key' => 'streak_30_days'],
                ['days' => 100, 'key' => 'streak_100_days']
            ];

            foreach ($streakMilestones as $milestone) {
                if ($longestStreak >= $milestone['days'] && 
                    !in_array($allAchievements[$milestone['key']]['name'], $existing)) {
                    $awarded[] = array_merge($allAchievements[$milestone['key']], [
                        'value' => $milestone['days'] . ' days'
                    ]);
                }
            }
        }

        return $awarded;
    }

    private function checkVolumeAchievements($userId, $existing, $allAchievements)
    {
        $awarded = [];
        
        // Check single workout volume
        $query = "SELECT 
                    ws.id,
                    SUM(wel.weight_kg * wel.reps_completed) as session_volume
                  FROM workout_sessions ws
                  JOIN workout_exercise_logs wel ON ws.id = wel.workout_session_id
                  WHERE ws.user_id = ?
                  GROUP BY ws.id
                  ORDER BY session_volume DESC
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $data = $result->fetch_assoc();
            $maxVolume = $data['session_volume'];

            $volumeMilestones = [
                ['volume' => 1000, 'key' => 'volume_1000kg'],
                ['volume' => 5000, 'key' => 'volume_5000kg'],
                ['volume' => 10000, 'key' => 'volume_10000kg']
            ];

            foreach ($volumeMilestones as $milestone) {
                if ($maxVolume >= $milestone['volume'] && 
                    !in_array($allAchievements[$milestone['key']]['name'], $existing)) {
                    $awarded[] = array_merge($allAchievements[$milestone['key']], [
                        'value' => number_format($milestone['volume']) . 'kg'
                    ]);
                }
            }
        }

        // Check total volume
        $totalQuery = "SELECT SUM(wel.weight_kg * wel.reps_completed) as total_volume
                       FROM workout_sessions ws
                       JOIN workout_exercise_logs wel ON ws.id = wel.workout_session_id
                       WHERE ws.user_id = ?";
        
        $stmt = $this->conn->prepare($totalQuery);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $totalVolume = $data['total_volume'];

        if ($totalVolume >= 100000 && 
            !in_array($allAchievements['volume_100000kg_total']['name'], $existing)) {
            $awarded[] = array_merge($allAchievements['volume_100000kg_total'], [
                'value' => '100,000kg'
            ]);
        }

        return $awarded;
    }

    private function checkStrengthAchievements($userId, $existing, $allAchievements)
    {
        $awarded = [];
        
        // Get user's latest bodyweight
        $bwQuery = "SELECT user_bodyweight_kg 
                    FROM workout_sessions 
                    WHERE user_id = ? AND user_bodyweight_kg IS NOT NULL 
                    ORDER BY session_date DESC 
                    LIMIT 1";
        
        $stmt = $this->conn->prepare($bwQuery);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            return $awarded; // No bodyweight data
        }
        
        $bodyweight = $result->fetch_assoc()['user_bodyweight_kg'];

        // Check exercise-specific achievements
        $exerciseChecks = [
            ['exercise' => 'squat', 'multiplier' => 1, 'key' => 'squat_1x_bodyweight'],
            ['exercise' => 'squat', 'multiplier' => 2, 'key' => 'squat_2x_bodyweight'],
            ['exercise' => 'bench', 'multiplier' => 1, 'key' => 'bench_1x_bodyweight'],
            ['exercise' => 'bench', 'multiplier' => 1.5, 'key' => 'bench_15x_bodyweight'],
            ['exercise' => 'deadlift', 'multiplier' => 2, 'key' => 'deadlift_2x_bodyweight'],
            ['exercise' => 'deadlift', 'multiplier' => 2.5, 'key' => 'deadlift_25x_bodyweight']
        ];

        foreach ($exerciseChecks as $check) {
            $query = "SELECT MAX(estimated_1rm) as max_1rm
                      FROM exercise_1rm_tracking
                      WHERE user_id = ? AND LOWER(exercise_name) LIKE ?";
            
            $stmt = $this->conn->prepare($query);
            $exercisePattern = '%' . $check['exercise'] . '%';
            $stmt->bind_param("is", $userId, $exercisePattern);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $data = $result->fetch_assoc();
                $max1RM = $data['max_1rm'];
                $threshold = $bodyweight * $check['multiplier'];

                if ($max1RM >= $threshold && 
                    !in_array($allAchievements[$check['key']]['name'], $existing)) {
                    $awarded[] = array_merge($allAchievements[$check['key']], [
                        'value' => number_format($max1RM, 1) . 'kg',
                        'metadata' => [
                            'bodyweight' => $bodyweight,
                            'multiplier' => $check['multiplier']
                        ]
                    ]);
                }
            }
        }

        return $awarded;
    }

    private function checkBodyCompositionAchievements($userId, $existing, $allAchievements)
    {
        $awarded = [];
        
        // Check if first measurement exists
        $query = "SELECT COUNT(*) as total FROM body_measurements WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();

        if ($data['total'] >= 1 && 
            !in_array($allAchievements['first_measurement']['name'], $existing)) {
            $awarded[] = $allAchievements['first_measurement'];
        }

        // Check weight change
        $changeQuery = "SELECT 
                          (SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY measurement_date ASC LIMIT 1) as start_weight,
                          (SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY measurement_date DESC LIMIT 1) as current_weight";
        
        $stmt = $this->conn->prepare($changeQuery);
        $stmt->bind_param("ii", $userId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $data = $result->fetch_assoc();
            if ($data['start_weight'] && $data['current_weight']) {
                $weightChange = $data['start_weight'] - $data['current_weight'];

                $weightMilestones = [
                    ['change' => 5, 'key' => 'weight_loss_5kg'],
                    ['change' => 10, 'key' => 'weight_loss_10kg']
                ];

                foreach ($weightMilestones as $milestone) {
                    if ($weightChange >= $milestone['change'] && 
                        !in_array($allAchievements[$milestone['key']]['name'], $existing)) {
                        $awarded[] = array_merge($allAchievements[$milestone['key']], [
                            'value' => number_format($weightChange, 1) . 'kg'
                        ]);
                    }
                }
            }
        }

        return $awarded;
    }

    /**
     * Update workout streak
     */
    public function updateWorkoutStreak($userId, $workoutDate)
    {
        try {
            // Get or create streak record
            $query = "SELECT id, current_streak, longest_streak, last_activity_date
                      FROM user_streaks
                      WHERE user_id = ? AND streak_type = 'workout_streak'";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();

            $workoutDateObj = new DateTime($workoutDate);
            
            if ($result->num_rows > 0) {
                // Update existing streak
                $streak = $result->fetch_assoc();
                $lastDate = new DateTime($streak['last_activity_date']);
                $daysDiff = $workoutDateObj->diff($lastDate)->days;

                if ($daysDiff == 0) {
                    // Same day, no change
                    return $streak['current_streak'];
                } elseif ($daysDiff == 1) {
                    // Consecutive day, increment
                    $newStreak = $streak['current_streak'] + 1;
                    $longestStreak = max($newStreak, $streak['longest_streak']);
                } else {
                    // Streak broken, reset to 1
                    $newStreak = 1;
                    $longestStreak = $streak['longest_streak'];
                }

                $updateQuery = "UPDATE user_streaks 
                                SET current_streak = ?, longest_streak = ?, last_activity_date = ?
                                WHERE id = ?";
                
                $stmt = $this->conn->prepare($updateQuery);
                $stmt->bind_param("iisi", $newStreak, $longestStreak, $workoutDate, $streak['id']);
                $stmt->execute();

                return $newStreak;
            } else {
                // Create new streak
                $insertQuery = "INSERT INTO user_streaks 
                                (user_id, streak_type, current_streak, longest_streak, last_activity_date)
                                VALUES (?, 'workout_streak', 1, 1, ?)";
                
                $stmt = $this->conn->prepare($insertQuery);
                $stmt->bind_param("is", $userId, $workoutDate);
                $stmt->execute();

                return 1;
            }

        } catch (Exception $e) {
            error_log("Error in updateWorkoutStreak: " . $e->getMessage());
            throw $e;
        }
    }
}
