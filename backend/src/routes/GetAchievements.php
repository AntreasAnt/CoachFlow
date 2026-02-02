<?php
define('APP_RUNNING', true);
require_once '../bootstrap.php';
require_once '../models/AnalyticsModel.php';
require_once '../config/AchievementsConfig.php';
require_once '../config/cors.php';
require_once '../config/Auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Check authentication
    $userId = checkAuth();
    if (!$userId) {
        throw new Exception('Authentication required');
    }

    // Get earned achievements
    $query = "SELECT 
                achievement_type,
                achievement_name,
                description,
                icon,
                value,
                achieved_date,
                metadata
              FROM user_achievements
              WHERE user_id = ?
              ORDER BY achieved_date DESC";
    
    $database = new Database();
    $conn = $database->connect();
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $earned = [];
    while ($row = $result->fetch_assoc()) {
        if ($row['metadata']) {
            $row['metadata'] = json_decode($row['metadata'], true);
        }
        $earned[] = $row;
    }

    // Get all available achievements
    $allAchievements = AchievementsConfig::getAchievements();
    
    // Calculate progress toward unearned achievements
    $earnedNames = array_column($earned, 'achievement_name');
    $available = [];
    
    foreach ($allAchievements as $key => $achievement) {
        if (!in_array($achievement['name'], $earnedNames)) {
            $available[] = $achievement;
        }
    }

    echo json_encode([
        'success' => true,
        'earned' => $earned,
        'available' => $available,
        'total_earned' => count($earned),
        'total_available' => count($allAchievements)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
