<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/ProgramModel.php';
require_once '../models/PurchaseModel.php';
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
    error_log("GetProgramDetails - Starting request");
    
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        error_log("GetProgramDetails - User not authenticated");
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    // Get program ID from query parameter
    $programId = $_GET['programId'] ?? $_GET['id'] ?? null;
    
    if (!$programId) {
        error_log("GetProgramDetails - Program ID is required");
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Program ID is required']);
        exit();
    }

    error_log("GetProgramDetails - Fetching program ID: $programId for user: $userId");

    $programModel = new ProgramModel();
    $purchaseModel = new PurchaseModel();
    
    // Check if user has purchased this program
    $hasAccess = $purchaseModel->hasAccess($userId, $programId);
    
    error_log("GetProgramDetails - User has access: " . ($hasAccess ? 'Yes' : 'No'));
    
    if (!$hasAccess) {
        error_log("GetProgramDetails - User does not have access to program $programId");
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You do not have access to this program']);
        exit();
    }

    // Get program details with sessions and exercises.
    // If the trainee has access, allow viewing even if the trainer later archived/removed it.
    $program = $programModel->getProgramById($programId, true, true);
    
    if (!$program) {
        error_log("GetProgramDetails - Program not found: $programId");
        throw new Exception('Program not found');
    }


    error_log("GetProgramDetails - Successfully retrieved program with " . count($program['sessions']) . " sessions");

    // Fetch user's review for this program
    $database = new Database();
    $conn = $database->connect();
    $checkStmt = $conn->prepare("SELECT rating, review_text FROM program_reviews WHERE program_id = ? AND trainee_id = ?");
    $checkStmt->bind_param("ii", $programId, $userId);
    $checkStmt->execute();
    $reviewResult = $checkStmt->get_result();
    
    if ($reviewResult->num_rows > 0) {
        $review = $reviewResult->fetch_assoc();
        $program['my_rating'] = (int)$review['rating'];
        $program['my_review_text'] = $review['review_text'];
    } else {
        $program['my_rating'] = 0;
        $program['my_review_text'] = '';
    }


    // Fetch all reviews for this program
    $reviewsStmt = $conn->prepare("
        SELECT r.rating, r.review_text, r.created_at, u.full_name as reviewer_name
        FROM program_reviews r
        JOIN user u ON r.trainee_id = u.userid
        WHERE r.program_id = ? AND r.review_text IS NOT NULL AND r.review_text != ''
        ORDER BY r.created_at DESC
        LIMIT 50
    ");
    $reviewsStmt->bind_param("i", $programId);
    $reviewsStmt->execute();
    $reviewsResult = $reviewsStmt->get_result();
    $program_reviews = [];
    while ($row = $reviewsResult->fetch_assoc()) {
        $program_reviews[] = $row;
    }
    $program['reviews'] = $program_reviews;

    echo json_encode([        'success' => true,
        'program' => $program
    ]);

} catch (Exception $e) {
    error_log("GetProgramDetails - Error: " . $e->getMessage());
    http_response_code(500);
    // Fetch all reviews for this program
    $reviewsStmt = $conn->prepare("
        SELECT r.rating, r.review_text, r.created_at, u.full_name as reviewer_name
        FROM program_reviews r
        JOIN user u ON r.trainee_id = u.userid
        WHERE r.program_id = ? AND r.review_text IS NOT NULL AND r.review_text != ''
        ORDER BY r.created_at DESC
        LIMIT 50
    ");
    $reviewsStmt->bind_param("i", $programId);
    $reviewsStmt->execute();
    $reviewsResult = $reviewsStmt->get_result();
    $program_reviews = [];
    while ($row = $reviewsResult->fetch_assoc()) {
        $program_reviews[] = $row;
    }
    $program['reviews'] = $program_reviews;

    echo json_encode([        'success' => false,
        'message' => $e->getMessage()
    ]);
}
