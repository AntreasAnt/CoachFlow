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
checkAuth(['admin', 'manager']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid input data']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    $conn->begin_transaction();
    
    $username = trim($input['username'] ?? '');
    $fullName = trim($input['fullName'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    // Check if username is already taken
    if (!empty($username)) {
        $checkQuery = "SELECT userid FROM user WHERE username = ? AND userid != ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("si", $username, $userId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        if ($checkResult->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'This username is already taken. Please choose another one.']);
            exit();
        }
    }

    // Check if email is already taken
    if (!empty($email)) {
        $checkQuery = "SELECT userid FROM user WHERE email = ? AND userid != ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("si", $email, $userId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        if ($checkResult->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'This email is already associated with another account.']);
            exit();
        }
    }

    // Check if phone is already taken
    if (!empty($phone)) {
        $checkQuery = "SELECT userid FROM user WHERE phone = ? AND userid != ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("si", $phone, $userId);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        if ($checkResult->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'This phone number is already associated with another account.']);
            exit();
        }
    }
    
    // Base query
    $query = "UPDATE user SET full_name = ?, phone = ?, email = ?";
    $params = [$fullName, $phone, $email];
    $types = "sss";

    if (!empty($username)) {
        $query .= ", username = ?";
        $params[] = $username;
        $types .= "s";
    }
    
    // If password is provided, append it to update
    if (!empty($password)) {
        $query .= ", password = ?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
        $types .= "s";
    }
    
    $query .= " WHERE userid = ?";
    $params[] = $userId;
    $types .= "i";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update profile: " . $stmt->error);
    }
    $conn->commit();
    
    // Check if everything updated and update session if needed
    if (!empty($username)) {
        $_SESSION['username'] = $username;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);

} catch (Exception $e) {
    if (isset($conn) && $conn instanceof mysqli) {
        try {
            $conn->rollback();
        } catch (Exception $ignored) {}
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred while updating the profile. Please try again.'
    ]);
}
