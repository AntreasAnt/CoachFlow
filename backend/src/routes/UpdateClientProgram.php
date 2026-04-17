<?php
// Route: UpdateClientProgram.php
// Purpose: Update an existing custom program for a specific client

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

// Check if user is a trainer
$userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
if ($userRole !== 'trainer') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$program_id = $input['program_id'] ?? null;
$title = $input['title'] ?? '';
$description = $input['description'] ?? '';
$category = $input['category'] ?? 'General Fitness';
$difficulty_level = $input['difficulty_level'] ?? 'beginner';
$duration_weeks = $input['duration_weeks'] ?? 4;
$sessions = $input['sessions'] ?? [];

if (!$program_id || !$title) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Program ID and title required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Verify that this program belongs to the trainer
    $verify_query = "SELECT id FROM premium_workout_plans 
                     WHERE id = ? AND created_by_trainer_id = ?";
    $stmt = $conn->prepare($verify_query);
    $stmt->bind_param('ii', $program_id, $trainer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Program not found or access denied.']);
        exit;
    }
    $stmt->close();
    
    $conn->begin_transaction();
    
    // Update the program in premium_workout_plans
    $update_query = "UPDATE premium_workout_plans 
                     SET title = ?, description = ?, duration_weeks = ?, 
                         difficulty_level = ?, category = ?
                     WHERE id = ? AND created_by_trainer_id = ?";
                     
    $stmt = $conn->prepare($update_query);
    $stmt->bind_param('sssssii', $title, $description, $duration_weeks, 
                     $difficulty_level, $category, $program_id, $trainer_id);
    $stmt->execute();
    $stmt->close();
    
    // Delete existing sessions and exercises
    // Foreign keys with CASCADE should handle premium_session_exercises, but just in case:
    $del_ex_query = "DELETE pse FROM premium_session_exercises pse
                     JOIN premium_program_sessions pps ON pse.session_id = pps.id
                     WHERE pps.program_id = ?";
    $del_stmt = $conn->prepare($del_ex_query);
    $del_stmt->bind_param('i', $program_id);
    $del_stmt->execute();
    $del_stmt->close();
    
    $del_sess_query = "DELETE FROM premium_program_sessions WHERE program_id = ?";
    $del_stmt = $conn->prepare($del_sess_query);
    $del_stmt->bind_param('i', $program_id);
    $del_stmt->execute();
    $del_stmt->close();
    
    // Add workout sessions anew
    if (!empty($sessions)) {
        $session_query = "INSERT INTO premium_program_sessions 
                          (program_id, session_name, session_description, week_number, day_number) 
                          VALUES (?, ?, ?, ?, ?)";
        $session_stmt = $conn->prepare($session_query);
        
        $exercise_query = "INSERT INTO premium_session_exercises 
                           (session_id, exercise_id, sets, reps, rpe, exercise_order) 
                           VALUES (?, ?, ?, ?, ?, ?)";
        $exercise_stmt = $conn->prepare($exercise_query);
    
        foreach ($sessions as $index => $session) {
            $session_name = $session['name'] ?? $session['session_name'] ?? "Session " . ($index + 1);
            $session_description = $session['description'] ?? $session['session_description'] ?? '';
            $week_number = $session['week_number'] ?? 1;
            $day_number = $session['day_number'] ?? 1;
            
            $session_stmt->bind_param('issii', $program_id, $session_name, $session_description, 
                                      $week_number, $day_number);
            $session_stmt->execute();
            $session_id = $session_stmt->insert_id;
            
            // Add exercises to session
            $exercises = $session['exercises'] ?? [];
            foreach ($exercises as $ex_index => $exercise) {
                $exercise_id = $exercise['exercise_id'] ?? null;
                $sets = $exercise['sets'] ?? 3;
                $reps = $exercise['reps'] ?? '10';
                $rpe = $exercise['rpe'] ?? '';
                $order = $ex_index + 1;
                
                if ($exercise_id) {
                    $exercise_stmt->bind_param('iisssi', $session_id, $exercise_id, $sets, $reps, $rpe, $order);
                    $exercise_stmt->execute();
                }
            }
        }
        
        $session_stmt->close();
        $exercise_stmt->close();
    }
    
    $conn->commit();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Custom program updated successfully',
        'program_id' => $program_id
    ]);
    
} catch (Exception $e) {
    error_log("UpdateClientProgram Error: " . $e->getMessage());
    if (isset($conn)) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
