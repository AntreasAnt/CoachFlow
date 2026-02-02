<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

checkAuth(['trainer', 'trainee']);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

$inputData = json_decode(file_get_contents("php://input"), true);

if (!$inputData || !isset($inputData['relationship_id'])) {
    echo json_encode(['success' => false, 'message' => 'Relationship ID is required']);
    exit;
}

$user_id = $_SESSION['user_id'];
$relationship_id = (int)$inputData['relationship_id'];
$reason = isset($inputData['reason']) ? trim($inputData['reason']) : null;

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Verify the user is part of this relationship
    $checkQuery = "SELECT id, trainer_id, trainee_id, status 
                   FROM coaching_relationships 
                   WHERE id = ? AND (trainer_id = ? OR trainee_id = ?) AND status = 'active'";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("iii", $relationship_id, $user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Relationship not found or you do not have permission to disconnect'
        ]);
        exit;
    }
    
    $relationship = $result->fetch_assoc();
    $stmt->close();
    
    // Update relationship status to 'disconnected'
    $updateQuery = "UPDATE coaching_relationships 
                    SET status = 'disconnected', 
                        ended_at = NOW(),
                        disconnect_reason = ?,
                        disconnected_by = ?
                    WHERE id = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("sii", $reason, $user_id, $relationship_id);
    
    if ($stmt->execute()) {
        // Log the disconnect
        error_log("Relationship disconnected: ID={$relationship_id}, User={$user_id}, Reason={$reason}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Successfully disconnected from coaching relationship',
            'relationship_id' => $relationship_id
        ]);
    } else {
        throw new Exception("Failed to disconnect: " . $stmt->error);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("DisconnectCoaching error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>