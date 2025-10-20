<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    echo "Adding RPE column to workout_exercise_logs table...\n";
    
    // Add the RPE column
    $query = "ALTER TABLE workout_exercise_logs ADD COLUMN rpe TINYINT(2) NULL DEFAULT NULL COMMENT 'Rate of Perceived Exertion (1-10)' AFTER weight_kg";
    
    if ($conn->query($query)) {
        echo "SUCCESS: RPE column added successfully!\n";
        
        // Verify the column was added
        $verifyQuery = "SHOW COLUMNS FROM workout_exercise_logs LIKE 'rpe'";
        $result = $conn->query($verifyQuery);
        
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo "Verified: RPE column exists - Type: " . $row['Type'] . " | Null: " . $row['Null'] . " | Default: " . $row['Default'] . "\n";
        }
    } else {
        echo "ERROR: " . $conn->error . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
