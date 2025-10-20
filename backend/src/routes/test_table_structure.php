<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Check if workout_exercise_logs table exists and get its structure
    $query = "SHOW COLUMNS FROM workout_exercise_logs";
    $result = $conn->query($query);
    
    if ($result) {
        echo "Table 'workout_exercise_logs' structure:\n";
        while ($row = $result->fetch_assoc()) {
            echo "Column: " . $row['Field'] . " | Type: " . $row['Type'] . " | Null: " . $row['Null'] . " | Default: " . $row['Default'] . "\n";
        }
    } else {
        echo "Table 'workout_exercise_logs' does not exist or query failed: " . $conn->error . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
