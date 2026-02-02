<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

checkAuth(['trainer', 'trainee', 'admin']);

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Get user_id from query parameter (for viewing others) or use session user (for own reviews)
    $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $_SESSION['user_id'];
    $include_reviewer_info = isset($_GET['include_reviewer_info']) && $_GET['include_reviewer_info'] === 'true';
    
    // Get reviews for this user
    $query = "SELECT 
                r.id,
                r.reviewer_id,
                r.reviewee_id,
                r.rating,
                r.review_text,
                r.created_at,
                r.updated_at";
    
    if ($include_reviewer_info) {
        $query .= ",
                u.username as reviewer_username,
                u.full_name as reviewer_name,
                u.role as reviewer_role";
    }
    
    $query .= " FROM reviews r";
    
    if ($include_reviewer_info) {
        $query .= " LEFT JOIN user u ON r.reviewer_id = u.userid";
    }
    
    $query .= " WHERE r.reviewee_id = ? ORDER BY r.updated_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = $row;
    }
    
    // Get rating statistics
    $statsQuery = "SELECT 
                    review_count,
                    ROUND(average_rating, 2) as average_rating,
                    five_star_count,
                    four_star_count,
                    three_star_count,
                    two_star_count,
                    one_star_count
                   FROM user_rating_stats 
                   WHERE user_id = ?";
    $stmt = $conn->prepare($statsQuery);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $statsResult = $stmt->get_result();
    
    $stats = $statsResult->fetch_assoc();
    if (!$stats) {
        $stats = [
            'review_count' => 0,
            'average_rating' => 0,
            'five_star_count' => 0,
            'four_star_count' => 0,
            'three_star_count' => 0,
            'two_star_count' => 0,
            'one_star_count' => 0
        ];
    }
    
    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'stats' => $stats,
        'reviews' => $reviews,
        'total_reviews' => count($reviews)
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("GetReviews error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>