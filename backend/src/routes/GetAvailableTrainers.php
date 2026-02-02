<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get query parameters for search and filtering
    $search = $_GET['search'] ?? '';
    $specialization = $_GET['specialization'] ?? '';
    $minRating = $_GET['minRating'] ?? 0;
    $maxRate = $_GET['maxRate'] ?? 999999;
    $minRate = $_GET['minRate'] ?? 0;
    $experienceLevel = $_GET['experienceLevel'] ?? '';
    $verified = $_GET['verified'] ?? '';
    $sortBy = $_GET['sortBy'] ?? 'rating'; // rating, price_asc, price_desc, clients, experience
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    // Build query
    $query = "SELECT 
                u.userid as id,
                u.full_name as name,
                u.email,
                u.username,
                tp.bio,
                tp.specializations,
                tp.certifications,
                tp.experience_years,
                tp.hourly_rate,
                tp.availability_status,
                tp.max_clients,
                tp.current_clients,
                COALESCE(urs.average_rating, tp.average_rating, 0) as average_rating,
                COALESCE(urs.review_count, tp.total_reviews, 0) as total_reviews,
                tp.profile_image,
                tp.verified,
                tp.created_at as member_since,
                CASE 
                    WHEN cr.id IS NOT NULL THEN 'active'
                    WHEN creq.id IS NOT NULL THEN 'pending'
                    ELSE 'none'
                END as connection_status
              FROM user u
              LEFT JOIN trainer_profiles tp ON u.userid = tp.user_id
              LEFT JOIN user_rating_stats urs ON u.userid = urs.user_id
              LEFT JOIN coaching_relationships cr ON u.userid = cr.trainer_id 
                  AND cr.trainee_id = ? AND cr.status = 'active'
              LEFT JOIN coaching_requests creq ON u.userid = creq.trainer_id 
                  AND creq.trainee_id = ? AND creq.status = 'pending'
              WHERE u.role = 'trainer'
              AND (tp.availability_status = 'available' OR tp.availability_status = 'limited')";
    
    $params = [$userId, $userId];
    $types = "ii";
    
    // Add search filter
    if (!empty($search)) {
        $query .= " AND (u.full_name LIKE ? OR u.username LIKE ? OR tp.bio LIKE ? OR tp.specializations LIKE ?)";
        $searchParam = "%{$search}%";
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
        $types .= "ssss";
    }
    
    // Add specialization filter
    if (!empty($specialization)) {
        $query .= " AND tp.specializations LIKE ?";
        $params[] = "%{$specialization}%";
        $types .= "s";
    }
    
    // Add rating filter
    if ($minRating > 0) {
        $query .= " AND COALESCE(urs.average_rating, tp.average_rating, 0) >= ?";
        $params[] = $minRating;
        $types .= "d";
    }
    
    // Add rate range filter
    if ($minRate > 0) {
        $query .= " AND tp.hourly_rate >= ?";
        $params[] = $minRate;
        $types .= "d";
    }
    
    if ($maxRate < 999999) {
        $query .= " AND tp.hourly_rate <= ?";
        $params[] = $maxRate;
        $types .= "d";
    }
    
    // Add experience level filter
    if (!empty($experienceLevel)) {
        $expYears = 0;
        switch ($experienceLevel) {
            case 'beginner':
                $expYears = 2;
                break;
            case 'intermediate':
                $expYears = 5;
                break;
            case 'expert':
                $expYears = 10;
                break;
        }
        if ($expYears > 0) {
            $query .= " AND tp.experience_years >= ?";
            $params[] = $expYears;
            $types .= "i";
        }
    }
    
    // Add verified filter
    if ($verified === 'true') {
        $query .= " AND tp.verified = 1";
    }
    
    // Add sorting
    switch ($sortBy) {
        case 'price_asc':
            $query .= " ORDER BY tp.hourly_rate ASC, COALESCE(urs.average_rating, tp.average_rating, 0) DESC";
            break;
        case 'price_desc':
            $query .= " ORDER BY tp.hourly_rate DESC, COALESCE(urs.average_rating, tp.average_rating, 0) DESC";
            break;
        case 'clients':
            $query .= " ORDER BY tp.current_clients DESC, COALESCE(urs.average_rating, tp.average_rating, 0) DESC";
            break;
        case 'experience':
            $query .= " ORDER BY tp.experience_years DESC, COALESCE(urs.average_rating, tp.average_rating, 0) DESC";
            break;
        case 'newest':
            $query .= " ORDER BY tp.created_at DESC";
            break;
        case 'rating':
        default:
            $query .= " ORDER BY COALESCE(urs.average_rating, tp.average_rating, 0) DESC, COALESCE(urs.review_count, tp.total_reviews, 0) DESC";
            break;
    }
    
    // Add pagination
    $query .= " LIMIT ? OFFSET ?";
    $params[] = (int)$limit;
    $params[] = (int)$offset;
    $types .= "ii";
    
    // Execute query
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trainers = [];
    while ($row = $result->fetch_assoc()) {
        // Parse specializations if it's a JSON string
        if (!empty($row['specializations'])) {
            $specs = json_decode($row['specializations'], true);
            $row['specializations'] = is_array($specs) ? $specs : [$row['specializations']];
        } else {
            $row['specializations'] = [];
        }
        
        // Parse certifications if it's a JSON string
        if (!empty($row['certifications'])) {
            $certs = json_decode($row['certifications'], true);
            $row['certifications'] = is_array($certs) ? $certs : [$row['certifications']];
        } else {
            $row['certifications'] = [];
        }
        
        // Calculate availability
        $row['accepting_clients'] = $row['current_clients'] < $row['max_clients'];
        
        $trainers[] = $row;
    }
    
    // Get total count for pagination
    $countQuery = "SELECT COUNT(DISTINCT u.userid) as total
                   FROM user u
                   LEFT JOIN trainer_profiles tp ON u.userid = tp.user_id
                   WHERE u.role = 'trainer'
                   AND (tp.availability_status = 'available' OR tp.availability_status = 'limited')";
    
    if (!empty($search)) {
        $countQuery .= " AND (u.full_name LIKE ? OR u.username LIKE ? OR tp.bio LIKE ? OR tp.specializations LIKE ?)";
    }
    
    $countStmt = $conn->prepare($countQuery);
    if (!empty($search)) {
        $countStmt->bind_param("ssss", $searchParam, $searchParam, $searchParam, $searchParam);
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $totalCount = $countResult->fetch_assoc()['total'];

    echo json_encode([
        'success' => true,
        'trainers' => $trainers,
        'total' => $totalCount,
        'limit' => (int)$limit,
        'offset' => (int)$offset
    ]);

} catch (Exception $e) {
    error_log("GetAvailableTrainers - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
