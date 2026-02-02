<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

checkAuth(['trainer', 'trainee']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->connect();
    
    $user_id = $_SESSION['user_id'];
    $reviewee_id = isset($_GET['reviewee_id']) ? (int)$_GET['reviewee_id'] : null;
    
    if (!$reviewee_id) {
        echo json_encode(['success' => false, 'message' => 'Reviewee ID is required']);
        exit;
    }
    
    // Get the existing review if it exists
    $query = "SELECT id, rating, review_text, created_at, updated_at 
              FROM reviews 
              WHERE reviewer_id = ? AND reviewee_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $user_id, $reviewee_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $review = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'has_reviewed' => true,
            'review' => $review
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'has_reviewed' => false,
            'review' => null
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("GetMyReview error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>