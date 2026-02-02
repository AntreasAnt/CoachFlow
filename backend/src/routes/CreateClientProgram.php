<?php
// Route: CreateClientProgram.php
// Purpose: Create a custom program for a specific client and auto-assign it

session_start();

if (!defined('APP_RUNNING')) {
    define('APP_RUNNING', true);
}

include_once("../config/cors.php");
include_once("../config/Database.php");

// Debug: Log session
error_log("CreateClientProgram Session: " . print_r($_SESSION, true));

// Check authentication
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated', 'session_keys' => array_keys($_SESSION)]);
    exit;
}

// Check if user is a trainer
$userRole = $_SESSION['user_privileges'] ?? $_SESSION['privileges'] ?? $_SESSION['role'] ?? null;
error_log("CreateClientProgram Role: " . ($userRole ?? 'NULL'));
if ($userRole !== 'trainer') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied', 'role' => $userRole, 'session_keys' => array_keys($_SESSION)]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$client_id = $input['client_id'] ?? null;
$title = $input['title'] ?? '';
$description = $input['description'] ?? '';
$long_description = $input['long_description'] ?? '';
$category = $input['category'] ?? 'General Fitness';
$difficulty_level = $input['difficulty_level'] ?? 'beginner';
$duration_weeks = $input['duration_weeks'] ?? 4;
$sessions = $input['sessions'] ?? [];
$tags = $input['tags'] ?? [];

if (!$client_id || !$title) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Client ID and title required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();
    
    $trainer_id = $_SESSION['user_id'];
    
    // Verify that this client belongs to the trainer
    $verify_query = "SELECT COUNT(*) as count FROM coaching_relationships 
                     WHERE trainer_id = ? AND trainee_id = ?";
    $stmt = $conn->prepare($verify_query);
    $stmt->bind_param('ii', $trainer_id, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    error_log("CreateClientProgram Relationship check: trainer_id=$trainer_id, client_id=$client_id, count=" . $row['count']);
    
    if ($row['count'] == 0) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => 'This user is not your client. Please add them as a client first.',
            'trainer_id' => $trainer_id,
            'client_id' => $client_id
        ]);
        exit;
    }
    $stmt->close();
    
    $conn->begin_transaction();
    
    // Create the program in premium_workout_plans (trainer-created custom program for client)
    $query = "INSERT INTO premium_workout_plans 
              (title, description, price, duration_weeks, difficulty_level, 
               category, created_by_trainer_id, is_active, created_at) 
              VALUES (?, ?, 0, ?, ?, ?, ?, 1, NOW())";
    
    error_log("CreateClientProgram: About to create program with title: $title");
    $stmt = $conn->prepare($query);
    $stmt->bind_param('sssssi', $title, $description, $duration_weeks, 
                     $difficulty_level, $category, $trainer_id);
    $stmt->execute();
    $program_id = $stmt->insert_id;
    $stmt->close();
    
    error_log("CreateClientProgram: Program created with ID: $program_id");
    
    // Add workout sessions for premium programs
    if (!empty($sessions)) {
        error_log("CreateClientProgram: Adding " . count($sessions) . " sessions to premium program");
        
        $session_query = "INSERT INTO premium_program_sessions 
                          (program_id, session_name, session_description, week_number, day_number) 
                          VALUES (?, ?, ?, ?, ?)";
        $session_stmt = $conn->prepare($session_query);
        
        $exercise_query = "INSERT INTO premium_session_exercises 
                           (session_id, exercise_id, sets, reps, rpe, exercise_order) 
                           VALUES (?, ?, ?, ?, ?, ?)";
        $exercise_stmt = $conn->prepare($exercise_query);
    
        foreach ($sessions as $index => $session) {
            $session_name = $session['name'] ?? "Session " . ($index + 1);
            $session_description = $session['description'] ?? '';
            $week_number = $session['week_number'] ?? 1;
            $day_number = $session['day_number'] ?? 1;
            
            error_log("CreateClientProgram: Creating session: $session_name");
            $session_stmt->bind_param('issii', $program_id, $session_name, $session_description, 
                                      $week_number, $day_number);
            $session_stmt->execute();
            $session_id = $session_stmt->insert_id;
            error_log("CreateClientProgram: Session created with ID: $session_id");
            
            // Add exercises to session
            $exercises = $session['exercises'] ?? [];
            error_log("CreateClientProgram: Adding " . count($exercises) . " exercises to session");
            foreach ($exercises as $ex_index => $exercise) {
                $exercise_id = $exercise['exercise_id'] ?? null;
                $sets = $exercise['sets'] ?? 3;
                $reps = $exercise['reps'] ?? '10';
                $rpe = $exercise['rpe'] ?? '';
                $order = $ex_index + 1;
                
                if ($exercise_id) {
                    $exercise_stmt->bind_param('iisssi', $session_id, $exercise_id, $sets, $reps, $rpe, $order);
                    $exercise_stmt->execute();
                    error_log("CreateClientProgram: Exercise $exercise_id added to session");
                }
            }
        }
        
        $session_stmt->close();
        $exercise_stmt->close();
    }
    
    // Create program assignment to track that trainer assigned this program to client
    $assign_query = "INSERT INTO program_assignments (trainer_id, trainee_id, program_id, assigned_at)
                     VALUES (?, ?, ?, NOW())";
    $assign_stmt = $conn->prepare($assign_query);
    $assign_stmt->bind_param('iii', $trainer_id, $client_id, $program_id);
    $assign_stmt->execute();
    $assign_stmt->close();
    
    $conn->commit();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Custom program created and assigned successfully',
        'program_id' => $program_id
    ]);
    
} catch (Exception $e) {
    error_log("CreateClientProgram Error: " . $e->getMessage());
    error_log("CreateClientProgram Error trace: " . $e->getTraceAsString());
    if (isset($conn)) {
        $conn->rollback();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
