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

if (!isset($data['period_id']) || !isset($data['period_name']) || !isset($data['start_date'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Period ID, name, and start date are required']);
    exit;
}

$userId = $_SESSION['user_id'];
$periodId = $data['period_id'];
$periodName = trim($data['period_name']);
$startDate = $data['start_date'];
$endDate = isset($data['end_date']) && !empty($data['end_date']) ? $data['end_date'] : null;
$notes = isset($data['notes']) ? trim($data['notes']) : null;

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Verify ownership
    $verifyQuery = "SELECT id FROM training_periods WHERE id = :period_id AND user_id = :user_id";
    $stmt = $conn->prepare($verifyQuery);
    $stmt->bindParam(':period_id', $periodId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Period not found or access denied']);
        exit;
    }

    // If end_date is provided, is_active is 0, otherwise 1
    $isActive = empty($endDate) ? 1 : 0;

    // Update the training period
    $updateQuery = "UPDATE training_periods 
                    SET period_name = :period_name,
                        start_date = :start_date,
                        end_date = :end_date,
                        is_active = :is_active,
                        notes = :notes
                    WHERE id = :period_id AND user_id = :user_id";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->bindParam(':period_name', $periodName);
    $stmt->bindParam(':start_date', $startDate);
    $stmt->bindParam(':end_date', $endDate);
    $stmt->bindParam(':is_active', $isActive);
    $stmt->bindParam(':notes', $notes);
    $stmt->bindParam(':period_id', $periodId);
    $stmt->bindParam(':user_id', $userId);
    
    $stmt->execute();

    // Update workout_sessions to link to this training period based on new dates
    $updateWorkoutsQuery = "UPDATE workout_sessions 
                            SET training_period_id = :period_id
                            WHERE user_id = :user_id 
                            AND DATE(created_at) >= :start_date";
    
    if (!empty($endDate)) {
        $updateWorkoutsQuery .= " AND DATE(created_at) <= :end_date";
    }
    
    $stmt = $conn->prepare($updateWorkoutsQuery);
    $stmt->bindParam(':period_id', $periodId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':start_date', $startDate);
    if (!empty($endDate)) {
        $stmt->bindParam(':end_date', $endDate);
    }
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Training period updated successfully'
    ]);

} catch (Exception $e) {
    error_log("UpdateTrainingPeriod Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update training period: ' . $e->getMessage()
    ]);
}
