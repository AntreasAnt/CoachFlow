<?php
require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['clientId']) || !isset($data['programId'])) {
    echo json_encode(['success' => false, 'message' => 'Client ID and Program ID are required']);
    exit();
}

try {
    $trainerId = $_SESSION['user_id'] ?? null;
    $clientId = $data['clientId'];
    $programId = $data['programId'];
    
    if (!$trainerId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();

    // Verify the program belongs to the trainer
    $checkProgramStmt = $conn->prepare("SELECT id FROM premium_workout_plans WHERE id = ? AND created_by_trainer_id = ?");
    $checkProgramStmt->bind_param("ii", $programId, $trainerId);
    $checkProgramStmt->execute();
    $programResult = $checkProgramStmt->get_result();
    
    if ($programResult->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Program not found or access denied']);
        exit();
    }
    $checkProgramStmt->close();

    // Verify the client relationship exists
    $checkClientStmt = $conn->prepare("
        SELECT id FROM coaching_relationships 
        WHERE trainer_id = ? AND trainee_id = ? AND status = 'active'
    ");
    $checkClientStmt->bind_param("ii", $trainerId, $clientId);
    $checkClientStmt->execute();
    $clientResult = $checkClientStmt->get_result();
    
    if ($clientResult->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Client relationship not found']);
        exit();
    }
    $checkClientStmt->close();

    // Check if program already assigned to this client
    $checkAssignedStmt = $conn->prepare("
        SELECT id FROM program_assignments 
        WHERE trainer_id = ? AND trainee_id = ? AND program_id = ?
    ");
    $checkAssignedStmt->bind_param("iii", $trainerId, $clientId, $programId);
    $checkAssignedStmt->execute();
    $assignedResult = $checkAssignedStmt->get_result();
    
    if ($assignedResult->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Program already assigned to this client']);
        exit();
    }
    $checkAssignedStmt->close();

    // Create assignment
    $assignStmt = $conn->prepare("
        INSERT INTO program_assignments (trainer_id, trainee_id, program_id, assigned_at)
        VALUES (?, ?, ?, NOW())
    ");
    $assignStmt->bind_param("iii", $trainerId, $clientId, $programId);
    
    if (!$assignStmt->execute()) {
        throw new Exception('Failed to assign program');
    }
    $assignStmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Program assigned successfully'
    ]);

} catch (Exception $e) {
    error_log("AssignProgramToClient Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
