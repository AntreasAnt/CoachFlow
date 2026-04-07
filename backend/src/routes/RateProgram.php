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
checkAuth(['trainee']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        throw new Exception('User not authenticated');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    $programId = $input['programId'] ?? null;
    $rating = $input['rating'] ?? null;
    $reviewText = $input['reviewText'] ?? '';

    if (!$programId || !$rating || !is_numeric($rating) || $rating < 1 || $rating > 5) {
        throw new Exception('Invalid rating data');
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Check if the user purchased this program
    $stmt = $conn->prepare("SELECT id FROM program_purchases WHERE trainee_id = ? AND program_id = ?");
    $stmt->bind_param("ii", $userId, $programId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Technically they shouldn't rate if they haven't purchased, but maybe they are assigned it.
        // We'll allow it if they are assigned.
        $stmt2 = $conn->prepare("SELECT id FROM program_assignments WHERE trainee_id = ? AND program_id = ?");
        $stmt2->bind_param("ii", $userId, $programId);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        if ($res2->num_rows === 0) {
            throw new Exception('You must purchase or be assigned this program to rate it.');
        }
        $purchaseId = 0; // Use 0 or null if assigned, wait, table schema needs purchase_id? Let's check.
    } else {
        $purchaseId = $result->fetch_assoc()['id'];
    }

    // Insert or update review
    // Table has: id, program_id, trainee_id, purchase_id, rating, review_text...
    
    // First, see if review exists
    $checkStmt = $conn->prepare("SELECT id FROM program_reviews WHERE program_id = ? AND trainee_id = ?");
    $checkStmt->bind_param("ii", $programId, $userId);
    $checkStmt->execute();
    $existRes = $checkStmt->get_result();
    
    $purchaseIdVal = isset($purchaseId) ? $purchaseId : 0;

    if ($existRes->num_rows > 0) {
        // Update
        $reviewId = $existRes->fetch_assoc()['id'];
        $updateStmt = $conn->prepare("UPDATE program_reviews SET rating = ?, review_text = ? WHERE id = ?");
        $updateStmt->bind_param("isi", $rating, $reviewText, $reviewId);
        $updateStmt->execute();
    } else {
        // Insert
        // Note: purchase_id cannot be null apparently from DESCRIBE? It says Null: NO for purchase_id. We'll set it to 0 if not purchased.
        $insertStmt = $conn->prepare("INSERT INTO program_reviews (program_id, trainee_id, purchase_id, rating, review_text) VALUES (?, ?, ?, ?, ?)");
        $insertStmt->bind_param("iiiis", $programId, $userId, $purchaseIdVal, $rating, $reviewText);
        $insertStmt->execute();
    }

    // Update the average in trainer_programs
    $avgStmt = $conn->prepare("
        UPDATE trainer_programs tp
        SET 
            rating_average = (SELECT IFNULL(AVG(rating), 0) FROM program_reviews WHERE program_id = tp.id),
            rating_count = (SELECT COUNT(*) FROM program_reviews WHERE program_id = tp.id)
        WHERE id = ?
    ");
    $avgStmt->bind_param("i", $programId);
    $avgStmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Rating submitted successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
