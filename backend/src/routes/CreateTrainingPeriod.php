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

if (!isset($data['period_name']) || !isset($data['start_date'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Period name and start date are required']);
    exit;
}

$userId = $_SESSION['user_id'];
$periodName = trim($data['period_name']);
$startDate = $data['start_date'];
$endDate = isset($data['end_date']) && !empty($data['end_date']) ? $data['end_date'] : null;
$notes = isset($data['notes']) ? trim($data['notes']) : null;

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Get trainer for this user if they have one
    $trainerQuery = "SELECT trainer_id FROM client_trainee_relationship 
                     WHERE trainee_id = :user_id AND status = 'active'
                     LIMIT 1";
    $stmt = $conn->prepare($trainerQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $trainerResult = $stmt->fetch(PDO::FETCH_ASSOC);
    $trainerId = $trainerResult ? $trainerResult['trainer_id'] : null;

    // If end_date is provided, is_active is 0, otherwise 1
    $isActive = empty($endDate) ? 1 : 0;

    // Insert the training period
    $insertQuery = "INSERT INTO training_periods 
                    (user_id, trainer_id, period_name, start_date, end_date, is_active, notes, created_at)
                    VALUES (:user_id, :trainer_id, :period_name, :start_date, :end_date, :is_active, :notes, NOW())";
    
    $stmt = $conn->prepare($insertQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':trainer_id', $trainerId, PDO::PARAM_INT);
    $stmt->bindParam(':period_name', $periodName);
    $stmt->bindParam(':start_date', $startDate);
    $stmt->bindParam(':end_date', $endDate);
    $stmt->bindParam(':is_active', $isActive);
    $stmt->bindParam(':notes', $notes);
    
    $stmt->execute();
    $periodId = $conn->lastInsertId();

    // Update workout_sessions to link to this training period based on dates
    $updateQuery = "UPDATE workout_sessions 
                    SET training_period_id = :period_id
                    WHERE user_id = :user_id 
                    AND DATE(created_at) >= :start_date";
    
    if (!empty($endDate)) {
        $updateQuery .= " AND DATE(created_at) <= :end_date";
    }
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->bindParam(':period_id', $periodId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':start_date', $startDate);
    if (!empty($endDate)) {
        $stmt->bindParam(':end_date', $endDate);
    }
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Training period created successfully',
        'period_id' => $periodId
    ]);

} catch (Exception $e) {
    error_log("CreateTrainingPeriod Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to create training period: ' . $e->getMessage()
    ]);
}
