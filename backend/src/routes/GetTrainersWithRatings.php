<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

checkAuth(['trainer', 'trainee', 'admin']);

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Get pagination and filtering parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;
    $min_rating = isset($_GET['min_rating']) ? (float)$_GET['min_rating'] : 0;
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'score'; // score, rating, reviews, recent
    
    // Calculate quality score: (average_rating * review_count) / (review_count + 10)
    // This gives weight to both rating and number of reviews
    // The +10 prevents new trainers with few reviews from ranking too high
    $query = "SELECT 
                u.userid,
                u.username,
                u.full_name,
                u.email,
                u.bio,
                u.specializations,
                u.certifications,
                u.years_of_experience,
                u.imageid as image,
                COALESCE(urs.review_count, 0) as review_count,
                COALESCE(ROUND(urs.average_rating, 2), 0) as average_rating,
                COALESCE(urs.five_star_count, 0) as five_star_count,
                COALESCE(urs.four_star_count, 0) as four_star_count,
                COALESCE(urs.three_star_count, 0) as three_star_count,
                COALESCE(urs.two_star_count, 0) as two_star_count,
                COALESCE(urs.one_star_count, 0) as one_star_count,
                ROUND((COALESCE(urs.average_rating, 0) * COALESCE(urs.review_count, 0)) / (COALESCE(urs.review_count, 0) + 10), 2) as quality_score
              FROM user u
              LEFT JOIN user_rating_stats urs ON u.userid = urs.user_id
              WHERE u.role = 'trainer' 
              AND u.isdeleted = 0 
              AND u.isdisabled = 0";
    
    // Apply minimum rating filter
    if ($min_rating > 0) {
        $query .= " AND COALESCE(urs.average_rating, 0) >= " . $min_rating;
    }
    
    // Apply sorting
    switch ($sort_by) {
        case 'rating':
            $query .= " ORDER BY average_rating DESC, review_count DESC";
            break;
        case 'reviews':
            $query .= " ORDER BY review_count DESC, average_rating DESC";
            break;
        case 'recent':
            $query .= " ORDER BY urs.last_review_date DESC";
            break;
        case 'score':
        default:
            $query .= " ORDER BY quality_score DESC, review_count DESC";
            break;
    }
    
    $query .= " LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $limit, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trainers = [];
    while ($row = $result->fetch_assoc()) {
        $trainers[] = $row;
    }
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total 
                   FROM user u
                   LEFT JOIN user_rating_stats urs ON u.userid = urs.user_id
                   WHERE u.role = 'trainer' 
                   AND u.isdeleted = 0 
                   AND u.isdisabled = 0";
    
    if ($min_rating > 0) {
        $countQuery .= " AND COALESCE(urs.average_rating, 0) >= " . $min_rating;
    }
    
    $countResult = $conn->query($countQuery);
    $totalCount = $countResult->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'trainers' => $trainers,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($totalCount / $limit),
            'total_trainers' => $totalCount,
            'per_page' => $limit
        ],
        'filters' => [
            'min_rating' => $min_rating,
            'sort_by' => $sort_by
        ]
    ]);
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("GetTrainersWithRatings error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>