<?php
require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee']);

header('Content-Type: application/json');

// Get the raw PUT data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON: ' . json_last_error_msg()
    ]);
    exit;
}

// Validate required fields
if (empty($data['programId']) || empty($data['title']) || empty($data['sessions']) || !is_array($data['sessions'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: programId, title, and sessions array required'
    ]);
    exit;
}

if (count($data['sessions']) === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'At least one workout session is required'
    ]);
    exit;
}

try {
    $userId = $_SESSION['user_id'] ?? null;
    $programId = $data['programId'];
    
    if (!$userId) {
        echo json_encode([
            'success' => false,
            'message' => 'User not authenticated'
        ]);
        exit;
    }

    $database = new Database();
    $conn = $database->connect();

    // Verify ownership
    $checkStmt = $conn->prepare("SELECT id FROM user_workout_plans WHERE id = ? AND user_id = ?");
    $checkStmt->bind_param("ii", $programId, $userId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Program not found or access denied'
        ]);
        exit;
    }
    $checkStmt->close();

    // Start transaction
    $conn->begin_transaction();

    // Update program package
    $programStmt = $conn->prepare("
        UPDATE user_workout_plans 
        SET name = ?,
            description = ?,
            difficulty_level = ?,
            category = ?,
            duration_weeks = ?
        WHERE id = ? AND user_id = ?
    ");

    $title = $data['title'];
    $description = $data['description'] ?? '';
    $difficulty = $data['difficulty_level'] ?? 'beginner';
    $category = $data['category'] ?? 'Strength';
    $duration = $data['duration_weeks'] ?? 4;

    $programStmt->bind_param(
        "sssisii",
        $title,
        $description,
        $difficulty,
        $category,
        $duration,
        $programId,
        $userId
    );

    if (!$programStmt->execute()) {
        throw new Exception('Failed to update program: ' . $programStmt->error);
    }
    $programStmt->close();

    // Delete existing sessions (cascade will delete exercises)
    $deleteSessionsStmt = $conn->prepare("DELETE FROM program_workout_sessions WHERE program_package_id = ?");
    $deleteSessionsStmt->bind_param("i", $programId);
    $deleteSessionsStmt->execute();
    $deleteSessionsStmt->close();

    // Insert updated sessions
    $sessionStmt = $conn->prepare("
        INSERT INTO program_workout_sessions (
            program_package_id,
            name,
            description,
            week_number,
            day_number,
            created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
    ");

    $exerciseStmt = $conn->prepare("
        INSERT INTO program_session_exercises (
            session_id,
            exercise_id,
            sets,
            reps,
            duration,
            rpe,
            exercise_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($data['sessions'] as $sessionIndex => $session) {
        // Insert session
        $sessionName = $session['name'];
        $sessionDesc = $session['description'] ?? '';
        $weekNum = $session['week_number'] ?? 1;
        $dayNum = $session['day_number'] ?? 1;

        $sessionStmt->bind_param(
            "issii",
            $programId,
            $sessionName,
            $sessionDesc,
            $weekNum,
            $dayNum
        );

        if (!$sessionStmt->execute()) {
            throw new Exception('Failed to create session: ' . $sessionStmt->error);
        }

        $sessionId = $conn->insert_id;

        // Insert exercises for this session
        if (!empty($session['exercises']) && is_array($session['exercises'])) {
            foreach ($session['exercises'] as $exIndex => $exercise) {
                $exerciseId = $exercise['exercise_id'];
                $sets = $exercise['sets'] ?? 3;
                $reps = $exercise['reps'] ?? null;
                $duration = $exercise['duration'] ?? null;
                $rpe = $exercise['rpe'] ?? null;
                $order = $exIndex + 1;

                $exerciseStmt->bind_param(
                    "iiisssi",
                    $sessionId,
                    $exerciseId,
                    $sets,
                    $reps,
                    $duration,
                    $rpe,
                    $order
                );

                if (!$exerciseStmt->execute()) {
                    throw new Exception('Failed to add exercise: ' . $exerciseStmt->error);
                }
            }
        }
    }

    $sessionStmt->close();
    $exerciseStmt->close();

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Workout program updated successfully',
        'program_id' => $programId
    ]);

} catch (Exception $e) {
    // Rollback on error
    if (isset($conn) && $conn) {
        $conn->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
