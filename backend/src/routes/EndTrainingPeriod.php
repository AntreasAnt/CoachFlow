<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/config/cors.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['period_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Period ID is required']);
    exit;
}

$userId = $_SESSION['user_id'];
$periodId = $data['period_id'];

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Verify ownership
    $verifyQuery = "SELECT id, start_date FROM training_periods 
                    WHERE id = :period_id AND user_id = :user_id AND is_active = 1";
    $stmt = $conn->prepare($verifyQuery);
    $stmt->bindParam(':period_id', $periodId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $period = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$period) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Period not found, access denied, or already ended']);
        exit;
    }

    // End the period with today's date
    $today = date('Y-m-d');
    
    $updateQuery = "UPDATE training_periods 
                    SET end_date = :end_date,
                        is_active = 0
                    WHERE id = :period_id AND user_id = :user_id";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->bindParam(':end_date', $today);
    $stmt->bindParam(':period_id', $periodId);
    $stmt->bindParam(':user_id', $userId);
    
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Training period ended successfully'
    ]);

} catch (Exception $e) {
    error_log("EndTrainingPeriod Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to end training period: ' . $e->getMessage()
    ]);
}
