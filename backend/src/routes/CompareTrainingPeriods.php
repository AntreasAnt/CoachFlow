<?php
define('APP_RUNNING', true);
require_once '../bootstrap.php';
require_once '../models/AnalyticsModel.php';
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

    $database = new Database();
    $conn = $database->connect();
    
    // Get training periods
    $query = "SELECT 
                tp.id,
                tp.period_name,
                tp.start_date,
                tp.end_date,
                tp.is_active,
                tp.notes,
                u.name as trainer_name,
                u.imageid as trainer_image
              FROM training_periods tp
              LEFT JOIN user u ON tp.trainer_id = u.userid
              WHERE tp.user_id = ?
              ORDER BY tp.start_date DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $periods = [];
    while ($row = $result->fetch_assoc()) {
        $periods[] = $row;
    }

    if (count($periods) < 2) {
        echo json_encode([
            'success' => true,
            'message' => 'Need at least 2 training periods to compare',
            'periods' => $periods,
            'comparison' => null
        ]);
        exit();
    }

    // Get period IDs to compare (default: compare last 2 periods or from query params)
    $period1Id = isset($_GET['period1_id']) ? intval($_GET['period1_id']) : $periods[1]['id'];
    $period2Id = isset($_GET['period2_id']) ? intval($_GET['period2_id']) : $periods[0]['id'];

    $analyticsModel = new AnalyticsModel();
    
    // Get analytics for both periods
    $period1 = null;
    $period2 = null;
    
    foreach ($periods as $p) {
        if ($p['id'] == $period1Id) $period1 = $p;
        if ($p['id'] == $period2Id) $period2 = $p;
    }

    $analytics1 = $analyticsModel->getUserAnalytics(
        $userId, 
        $period1['start_date'], 
        $period1['end_date'] ?? date('Y-m-d'), 
        $period1Id
    );

    $analytics2 = $analyticsModel->getUserAnalytics(
        $userId, 
        $period2['start_date'], 
        $period2['end_date'] ?? date('Y-m-d'), 
        $period2Id
    );

    // Calculate changes
    $comparison = [
        'period1' => [
            'info' => $period1,
            'analytics' => $analytics1
        ],
        'period2' => [
            'info' => $period2,
            'analytics' => $analytics2
        ],
        'changes' => [
            'workouts' => [
                'period1' => $analytics1['overview']['total_workouts'],
                'period2' => $analytics2['overview']['total_workouts'],
                'change' => $analytics2['overview']['total_workouts'] - $analytics1['overview']['total_workouts'],
                'percent' => $analytics1['overview']['total_workouts'] > 0 
                    ? (($analytics2['overview']['total_workouts'] - $analytics1['overview']['total_workouts']) / $analytics1['overview']['total_workouts']) * 100
                    : 0
            ],
            'volume' => [
                'period1' => round($analytics1['overview']['total_volume_kg'], 2),
                'period2' => round($analytics2['overview']['total_volume_kg'], 2),
                'change' => round($analytics2['overview']['total_volume_kg'] - $analytics1['overview']['total_volume_kg'], 2),
                'percent' => $analytics1['overview']['total_volume_kg'] > 0
                    ? (($analytics2['overview']['total_volume_kg'] - $analytics1['overview']['total_volume_kg']) / $analytics1['overview']['total_volume_kg']) * 100
                    : 0
            ],
            'avg_rpe' => [
                'period1' => round($analytics1['overview']['avg_rpe'], 2),
                'period2' => round($analytics2['overview']['avg_rpe'], 2),
                'change' => round($analytics2['overview']['avg_rpe'] - $analytics1['overview']['avg_rpe'], 2)
            ],
            'personal_records' => [
                'period1' => count($analytics1['personal_records']),
                'period2' => count($analytics2['personal_records']),
                'change' => count($analytics2['personal_records']) - count($analytics1['personal_records'])
            ]
        ]
    ];

    echo json_encode([
        'success' => true,
        'periods' => $periods,
        'comparison' => $comparison
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
