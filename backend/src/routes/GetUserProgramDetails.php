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
checkAuth(['trainee']);

header('Content-Type: application/json');

try {
    $userId = $_SESSION['user_id'] ?? null;
    $programId = $_GET['programId'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'User not authenticated'
        ]);
        exit;
    }

    if (!$programId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Program ID is required'
        ]);
        exit;
    }

    $database = new Database();
    $conn = $database->connect();

    // Get program details and verify ownership
    $programQuery = "SELECT 
                        id,
                        user_id,
                        name as title,
                        description,
                        duration_weeks,
                        difficulty_level,
                        category,
                        is_program_package,
                        created_at
                     FROM user_workout_plans
                     WHERE id = ? AND user_id = ? AND is_program_package = 1";
    
    $programStmt = $conn->prepare($programQuery);
    $programStmt->bind_param("ii", $programId, $userId);
    $programStmt->execute();
    $programResult = $programStmt->get_result();
    
    if ($programResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Program not found or access denied'
        ]);
        exit;
    }

    $program = $programResult->fetch_assoc();
    $programStmt->close();

    // Get sessions for this program
    $sessionQuery = "SELECT 
                        id,
                        name as session_name,
                        description as session_description,
                        week_number,
                        day_number
                     FROM program_workout_sessions
                     WHERE program_package_id = ?
                     ORDER BY week_number ASC, day_number ASC";
    
    $sessionStmt = $conn->prepare($sessionQuery);
    $sessionStmt->bind_param("i", $programId);
    $sessionStmt->execute();
    $sessionResult = $sessionStmt->get_result();
    
    $sessions = [];
    while ($sessionRow = $sessionResult->fetch_assoc()) {
        $sessionId = $sessionRow['id'];
        
        // Get exercises for this session
        $exerciseQuery = "SELECT 
                            pse.exercise_id,
                            pse.sets,
                            pse.reps,
                            pse.duration,
                            pse.rpe,
                            pse.exercise_order,
                            e.name,
                            e.category,
                            e.muscle_group,
                            e.equipment,
                            e.instructions
                          FROM program_session_exercises pse
                          JOIN exercises e ON pse.exercise_id = e.id
                          WHERE pse.session_id = ?
                          ORDER BY pse.exercise_order ASC";
        
        $exerciseStmt = $conn->prepare($exerciseQuery);
        $exerciseStmt->bind_param("i", $sessionId);
        $exerciseStmt->execute();
        $exerciseResult = $exerciseStmt->get_result();
        
        $exercises = [];
        while ($exerciseRow = $exerciseResult->fetch_assoc()) {
            $exercises[] = $exerciseRow;
        }
        $exerciseStmt->close();
        
        $sessionRow['exercises'] = $exercises;
        $sessionRow['exercise_count'] = count($exercises);
        $sessions[] = $sessionRow;
    }
    $sessionStmt->close();

    $program['sessions'] = $sessions;
    $program['session_count'] = count($sessions);
    $program['trainer_name'] = 'You'; // Self-created program

    echo json_encode([
        'success' => true,
        'program' => $program
    ]);

} catch (Exception $e) {
    error_log("GetUserProgramDetails Error: " . $e->getMessage());
    error_log("GetUserProgramDetails Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
