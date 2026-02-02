<?php
// Script to update nutrition_goals table to support trainer-assigned goals
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    echo "Updating nutrition_goals table schema...\n\n";
    
    // Check if columns already exist
    $result = $conn->query("SHOW COLUMNS FROM nutrition_goals LIKE 'assigned_by_trainer_id'");
    
    if ($result->num_rows == 0) {
        // Add column to track if goal was set by trainer
        $sql1 = "ALTER TABLE nutrition_goals 
                 ADD COLUMN assigned_by_trainer_id INT(11) NULL AFTER user_id,
                 ADD COLUMN source ENUM('self', 'trainer') NOT NULL DEFAULT 'self' AFTER assigned_by_trainer_id,
                 ADD INDEX idx_trainer (assigned_by_trainer_id)";
        
        if ($conn->query($sql1)) {
            echo "✓ Added columns: assigned_by_trainer_id, source\n";
        } else {
            echo "✗ Error adding columns: " . $conn->error . "\n";
        }
    } else {
        echo "✓ Columns already exist\n";
    }
    
    // Check current data
    $result = $conn->query("SELECT COUNT(*) as total, 
                           SUM(CASE WHEN source = 'self' THEN 1 ELSE 0 END) as self_created,
                           SUM(CASE WHEN source = 'trainer' THEN 1 ELSE 0 END) as trainer_assigned
                           FROM nutrition_goals");
    $stats = $result->fetch_assoc();
    
    echo "\nCurrent nutrition_goals statistics:\n";
    echo "  Total goals: " . $stats['total'] . "\n";
    echo "  Self-created: " . $stats['self_created'] . "\n";
    echo "  Trainer-assigned: " . $stats['trainer_assigned'] . "\n";
    
    echo "\nSchema update complete!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
