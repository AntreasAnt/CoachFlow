<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

checkAuth(['trainer', 'trainee']);

if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    echo json_encode(['success' => false, 'message' => 'Only DELETE method allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->connect();
    
    $reviewer_id = $_SESSION['user_id'];
    $review_id = isset($_GET['review_id']) ? (int)$_GET['review_id'] : null;
    
    if (!$review_id) {
        echo json_encode(['success' => false, 'message' => 'Review ID is required']);
        exit;
    }
    
    // Check if review exists and belongs to this user
    $checkQuery = "SELECT id FROM reviews WHERE id = ? AND reviewer_id = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("ii", $review_id, $reviewer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Review not found or you do not have permission to delete it']);
        exit;
    }
    
    $stmt->close();
    
    // Delete the review
    $deleteQuery = "DELETE FROM reviews WHERE id = ? AND reviewer_id = ?";
    $stmt = $conn->prepare($deleteQuery);
    $stmt->bind_param("ii", $review_id, $reviewer_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Review deleted successfully'
        ]);
    } else {
        throw new Exception("Failed to delete review: " . $stmt->error);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("DeleteReview error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>