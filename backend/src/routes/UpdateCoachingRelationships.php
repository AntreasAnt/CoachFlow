<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    echo "=== Updating Coaching Relationships for One-Trainer Rule ===\n\n";
    
    // Check if columns exist
    $result = $conn->query("SHOW COLUMNS FROM coaching_relationships");
    $existingColumns = [];
    while ($row = $result->fetch_assoc()) {
        $existingColumns[] = $row['Field'];
    }
    
    // Add disconnect tracking columns
    $columnsToAdd = [
        'ended_at' => "ALTER TABLE coaching_relationships ADD COLUMN ended_at TIMESTAMP NULL",
        'disconnect_reason' => "ALTER TABLE coaching_relationships ADD COLUMN disconnect_reason TEXT NULL",
        'disconnected_by' => "ALTER TABLE coaching_relationships ADD COLUMN disconnected_by INT NULL"
    ];
    
    echo "1. Adding disconnect tracking columns...\n";
    foreach ($columnsToAdd as $column => $sql) {
        if (!in_array($column, $existingColumns)) {
            if ($conn->query($sql)) {
                echo "   ✓ Added column: $column\n";
            } else {
                echo "   ✗ Error adding $column: " . $conn->error . "\n";
            }
        } else {
            echo "   - Column already exists: $column\n";
        }
    }
    
    // Update status enum if needed
    echo "\n2. Updating status enum to include 'disconnected'...\n";
    $modifyStatus = "ALTER TABLE coaching_relationships 
                     MODIFY COLUMN status ENUM('pending', 'active', 'disconnected', 'declined') DEFAULT 'pending'";
    if ($conn->query($modifyStatus)) {
        echo "   ✓ Status enum updated\n";
    } else {
        echo "   - Status enum may already be correct: " . $conn->error . "\n";
    }
    
    // Create a constraint function to check one trainer per trainee
    echo "\n3. Creating stored procedure to check one-trainer rule...\n";
    $conn->query("DROP PROCEDURE IF EXISTS check_one_trainer_rule");
    
    $procedureSQL = "CREATE PROCEDURE check_one_trainer_rule(IN p_trainee_id INT, IN p_trainer_id INT)
    BEGIN
        DECLARE existing_count INT;
        
        SELECT COUNT(*) INTO existing_count
        FROM coaching_relationships
        WHERE trainee_id = p_trainee_id 
        AND status = 'active'
        AND trainer_id != p_trainer_id;
        
        IF existing_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Trainee already has an active trainer. Please disconnect from current trainer first.';
        END IF;
    END";
    
    if ($conn->query($procedureSQL)) {
        echo "   ✓ Stored procedure created\n";
    } else {
        echo "   ✗ Error creating procedure: " . $conn->error . "\n";
    }
    
    echo "\n=== Table Structure Updated ===\n";
    $result = $conn->query("DESCRIBE coaching_relationships");
    while ($row = $result->fetch_assoc()) {
        if (in_array($row['Field'], ['status', 'ended_at', 'disconnect_reason', 'disconnected_by'])) {
            echo "{$row['Field']}: {$row['Type']}\n";
        }
    }
    
    echo "\n✅ Update completed successfully!\n";
    echo "\nFeatures added:\n";
    echo "- Disconnect tracking (who disconnected and when)\n";
    echo "- Disconnect reason storage\n";
    echo "- Status now includes 'disconnected'\n";
    echo "- One-trainer-per-trainee validation procedure\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>