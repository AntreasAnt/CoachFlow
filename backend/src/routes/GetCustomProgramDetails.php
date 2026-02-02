<?php
// Route: GetCustomProgramDetails.php
// Purpose: Get details of custom trainer-created programs for viewing/editing

session_start();

if (!defined('APP_RUNNING')) {
    define('APP_RUNNING', true);
}

include_once("../config/cors.php");
include_once("../config/Database.php");

// Check authentication
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Get program ID from query parameter
$program_id = $_GET['programId'] ?? $_GET['id'] ?? null;

if (!$program_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Program ID is required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $user_id = $_SESSION['user_id'];
    $user_role = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
    
    // Get program details
    $program_query = "SELECT p.*, u.username as trainer_name
                      FROM premium_workout_plans p
                      LEFT JOIN user u ON p.created_by_trainer_id = u.userid
                      WHERE p.id = ?";
    
    $stmt = $conn->prepare($program_query);
    $stmt->bind_param('i', $program_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $program = $result->fetch_assoc();
    $stmt->close();
    
    if (!$program) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Program not found']);
        exit;
    }
    
    // Check access: trainer who created it, or trainee assigned to it
    $has_access = false;
    
    if ($user_role === 'trainer' && $program['created_by_trainer_id'] == $user_id) {
        // Trainer who created the program
        $has_access = true;
    } elseif ($user_role === 'trainee' || $user_role === 'trainer') {
        // Check if program is assigned to this user (for trainees) or if trainer has access
        $assignment_query = "SELECT COUNT(*) as count FROM program_assignments 
                            WHERE program_id = ? AND (trainee_id = ? OR trainer_id = ?)";
        $stmt = $conn->prepare($assignment_query);
        $stmt->bind_param('iii', $program_id, $user_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $assignment = $result->fetch_assoc();
        $stmt->close();
        
        if ($assignment['count'] > 0) {
            $has_access = true;
        }
    }
    
    if (!$has_access) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
    
    // Get sessions for this program
    $sessions_query = "SELECT * FROM premium_program_sessions 
                       WHERE program_id = ? 
                       ORDER BY week_number, day_number, order_index";
    
    $stmt = $conn->prepare($sessions_query);
    $stmt->bind_param('i', $program_id);
    $stmt->execute();
    $sessions_result = $stmt->get_result();
    $sessions = [];
    
    while ($session = $sessions_result->fetch_assoc()) {
        $session_id = $session['id'];
        
        // Get exercises for this session
        $exercises_query = "SELECT pse.*, e.name as exercise_name, e.muscle_group, e.equipment
                           FROM premium_session_exercises pse
                           JOIN exercises e ON pse.exercise_id = e.id
                           WHERE pse.session_id = ?
                           ORDER BY pse.exercise_order";
        
        $ex_stmt = $conn->prepare($exercises_query);
        $ex_stmt->bind_param('i', $session_id);
        $ex_stmt->execute();
        $exercises_result = $ex_stmt->get_result();
        $exercises = [];
        
        while ($exercise = $exercises_result->fetch_assoc()) {
            $exercises[] = $exercise;
        }
        $ex_stmt->close();
        
        $session['exercises'] = $exercises;
        $sessions[] = $session;
    }
    $stmt->close();
    
    $program['sessions'] = $sessions;
    
    $db->close();
    
    echo json_encode([
        'success' => true,
        'program' => $program
    ]);
    
} catch (Exception $e) {
    error_log("GetCustomProgramDetails Error: " . $e->getMessage());
    if (isset($conn)) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>