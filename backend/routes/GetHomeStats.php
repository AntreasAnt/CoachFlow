<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/config/cors.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get latest weight
    $weightQuery = "SELECT weight_kg, measurement_date 
                    FROM body_measurements 
                    WHERE user_id = :user_id 
                    ORDER BY measurement_date DESC, created_at DESC 
                    LIMIT 1";
    
    $stmt = $conn->prepare($weightQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $latestWeight = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get weight from 30 days ago for comparison
    $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
    $previousQuery = "SELECT weight_kg 
                      FROM body_measurements 
                      WHERE user_id = :user_id 
                      AND measurement_date <= :thirty_days_ago
                      ORDER BY measurement_date DESC 
                      LIMIT 1";
    
    $stmt = $conn->prepare($previousQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':thirty_days_ago', $thirtyDaysAgo);
    $stmt->execute();
    $previousWeight = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get workouts this week
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $workoutsQuery = "SELECT COUNT(*) as count 
                      FROM workout_sessions 
                      WHERE user_id = :user_id 
                      AND session_date >= :week_start";
    
    $stmt = $conn->prepare($workoutsQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':week_start', $weekStart);
    $stmt->execute();
    $workouts = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get current workout streak
    $streakQuery = "SELECT current_streak, longest_streak 
                    FROM user_streaks 
                    WHERE user_id = :user_id 
                    AND streak_type = 'workout_days'
                    LIMIT 1";
    
    $stmt = $conn->prepare($streakQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $streak = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get total workout time this month
    $monthStart = date('Y-m-01');
    $timeQuery = "SELECT SUM(duration_minutes) as total_minutes 
                  FROM workout_sessions 
                  WHERE user_id = :user_id 
                  AND session_date >= :month_start";
    
    $stmt = $conn->prepare($timeQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':month_start', $monthStart);
    $stmt->execute();
    $time = $stmt->fetch(PDO::FETCH_ASSOC);

    // Calculate weight change
    $weightChange = null;
    $changeType = 'neutral';
    if ($latestWeight && $previousWeight) {
        $weightChange = round($latestWeight['weight_kg'] - $previousWeight['weight_kg'], 2);
        if ($weightChange > 0) {
            $changeType = 'gain';
        } elseif ($weightChange < 0) {
            $changeType = 'loss';
        }
    }

    echo json_encode([
        'success' => true,
        'stats' => [
            'current_weight' => $latestWeight ? floatval($latestWeight['weight_kg']) : null,
            'weight_change' => $weightChange,
            'change_type' => $changeType,
            'workouts_this_week' => intval($workouts['count']),
            'current_streak' => $streak ? intval($streak['current_streak']) : 0,
            'longest_streak' => $streak ? intval($streak['longest_streak']) : 0,
            'total_time_hours' => $time['total_minutes'] ? round($time['total_minutes'] / 60, 1) : 0
        ]
    ]);

} catch (Exception $e) {
    error_log("GetHomeStats Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch stats: ' . $e->getMessage()
    ]);
}
