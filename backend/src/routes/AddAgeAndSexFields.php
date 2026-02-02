<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    echo "=== Adding Age and Sex Fields to User Table ===\n\n";
    
    // Check existing user table columns
    echo "1. Checking USER table columns...\n";
    $result = $conn->query("SHOW COLUMNS FROM user");
    $existingColumns = [];
    while ($row = $result->fetch_assoc()) {
        $existingColumns[] = $row['Field'];
    }
    
    // Add missing columns to user table
    $columnsToAdd = [
        'age' => "ALTER TABLE user ADD COLUMN age INT NULL COMMENT 'User age in years'",
        'sex' => "ALTER TABLE user ADD COLUMN sex ENUM('Male', 'Female', 'Other') NULL COMMENT 'User biological sex'"
    ];
    
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
    
    // Display updated user table structure
    echo "\n=== Updated User Table Structure ===\n";
    $result = $conn->query("DESCRIBE user");
    while ($row = $result->fetch_assoc()) {
        if (in_array($row['Field'], ['age', 'sex'])) {
            echo "NEW -> {$row['Field']}: {$row['Type']} {$row['Null']} {$row['Default']}\n";
        }
    }
    
    echo "\n✅ Database update completed successfully!\n";
    echo "\nThe following fields have been added for analytics:\n";
    echo "- age: INT (nullable) - User's age in years\n";
    echo "- sex: ENUM('Male', 'Female', 'Other') (nullable) - User's biological sex\n";
    echo "\nThese fields can now be used for fitness analytics and personalized recommendations.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>