<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

// Debug: Log session data
error_log("GetMyCoach - Session data: " . print_r($_SESSION, true));
error_log("GetMyCoach - user_id: " . ($_SESSION['user_id'] ?? 'NOT SET'));
error_log("GetMyCoach - user_privileges: " . ($_SESSION['user_privileges'] ?? 'NOT SET'));

checkAuth(['trainee']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->connect();
    
    $trainee_id = $_SESSION['user_id'];
    
    // Get current active coaching relationship
    $query = "SELECT 
                cr.id as relationship_id,
                cr.trainer_id,
                cr.started_at,
                cr.status,
                u.username,
                u.full_name as name,
                u.email,
                u.bio,
                u.specializations,
                u.certifications,
                u.years_of_experience,
                u.imageid as image,
                COALESCE(urs.review_count, 0) as review_count,
                COALESCE(ROUND(urs.average_rating, 2), 0) as average_rating
              FROM coaching_relationships cr
              JOIN user u ON cr.trainer_id = u.userid
              LEFT JOIN user_rating_stats urs ON u.userid = urs.user_id
              WHERE cr.trainee_id = ? AND cr.status = 'active'
              LIMIT 1";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $trainee_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $coach = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'has_coach' => true,
            'coach' => $coach
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'has_coach' => false,
            'coach' => null
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("GetMyCoach error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>