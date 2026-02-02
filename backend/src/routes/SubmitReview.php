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

if (!$inputData) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
if (!isset($inputData['reviewee_id']) || !isset($inputData['rating'])) {
    echo json_encode(['success' => false, 'message' => 'Reviewee ID and rating are required']);
    exit;
}

$reviewer_id = $_SESSION['user_id'];
$reviewee_id = (int)$inputData['reviewee_id'];
$rating = (int)$inputData['rating'];
$review_text = isset($inputData['review_text']) ? trim($inputData['review_text']) : null;

// Validate rating range
if ($rating < 1 || $rating > 5) {
    echo json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']);
    exit;
}

// Can't review yourself
if ($reviewer_id == $reviewee_id) {
    echo json_encode(['success' => false, 'message' => 'You cannot review yourself']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Check if users have an active coaching relationship
    $checkRelationship = "SELECT id, trainer_id, trainee_id 
                          FROM coaching_relationships 
                          WHERE ((trainer_id = ? AND trainee_id = ?) OR (trainer_id = ? AND trainee_id = ?))
                          AND status = 'active'";
    $stmt = $conn->prepare($checkRelationship);
    $stmt->bind_param("iiii", $reviewer_id, $reviewee_id, $reviewee_id, $reviewer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false, 
            'message' => 'You can only review users you have an active coaching relationship with'
        ]);
        exit;
    }
    
    $stmt->close();
    
    // Check if review already exists
    $checkReview = "SELECT id FROM reviews WHERE reviewer_id = ? AND reviewee_id = ?";
    $stmt = $conn->prepare($checkReview);
    $stmt->bind_param("ii", $reviewer_id, $reviewee_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing review
        $review = $result->fetch_assoc();
        $reviewId = $review['id'];
        $stmt->close();
        
        $updateSQL = "UPDATE reviews SET rating = ?, review_text = ?, updated_at = CURRENT_TIMESTAMP 
                      WHERE id = ?";
        $stmt = $conn->prepare($updateSQL);
        $stmt->bind_param("isi", $rating, $review_text, $reviewId);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Review updated successfully',
                'review_id' => $reviewId,
                'action' => 'updated'
            ]);
        } else {
            throw new Exception("Failed to update review: " . $stmt->error);
        }
    } else {
        // Create new review
        $stmt->close();
        
        $insertSQL = "INSERT INTO reviews (reviewer_id, reviewee_id, rating, review_text) 
                      VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($insertSQL);
        $stmt->bind_param("iiis", $reviewer_id, $reviewee_id, $rating, $review_text);
        
        if ($stmt->execute()) {
            $reviewId = $conn->insert_id;
            echo json_encode([
                'success' => true,
                'message' => 'Review submitted successfully',
                'review_id' => $reviewId,
                'action' => 'created'
            ]);
        } else {
            throw new Exception("Failed to create review: " . $stmt->error);
        }
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("SubmitReview error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred: ' . $e->getMessage()
    ]);
}
?>