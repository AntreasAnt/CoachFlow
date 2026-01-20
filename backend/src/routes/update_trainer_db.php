<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    echo "=== Starting Database Update for Trainer Dashboard ===\n\n";
    
    // Check existing user table columns
    echo "1. Checking USER table columns...\n";
    $result = $conn->query("SHOW COLUMNS FROM user");
    $existingColumns = [];
    while ($row = $result->fetch_assoc()) {
        $existingColumns[] = $row['Field'];
    }
    
    // Add missing columns to user table
    $columnsToAdd = [
        'bio' => "ALTER TABLE user ADD COLUMN bio TEXT",
        'specializations' => "ALTER TABLE user ADD COLUMN specializations TEXT",
        'certifications' => "ALTER TABLE user ADD COLUMN certifications TEXT",
        'years_of_experience' => "ALTER TABLE user ADD COLUMN years_of_experience INT DEFAULT 0",
        'instagram' => "ALTER TABLE user ADD COLUMN instagram VARCHAR(255)",
        'facebook' => "ALTER TABLE user ADD COLUMN facebook VARCHAR(255)",
        'twitter' => "ALTER TABLE user ADD COLUMN twitter VARCHAR(255)",
        'youtube' => "ALTER TABLE user ADD COLUMN youtube VARCHAR(255)",
        'linkedin' => "ALTER TABLE user ADD COLUMN linkedin VARCHAR(255)",
        'website' => "ALTER TABLE user ADD COLUMN website VARCHAR(255)",
        'stripe_account_id' => "ALTER TABLE user ADD COLUMN stripe_account_id VARCHAR(255)"
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
    
    // Check and create coaching_relationships table
    echo "\n2. Checking COACHING_RELATIONSHIPS table...\n";
    $result = $conn->query("SHOW TABLES LIKE 'coaching_relationships'");
    if ($result->num_rows == 0) {
        $sql = "CREATE TABLE coaching_relationships (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trainer_id INT NOT NULL,
            trainee_id INT NOT NULL,
            status ENUM('active', 'paused', 'ended') DEFAULT 'active',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            FOREIGN KEY (trainer_id) REFERENCES user(userid),
            FOREIGN KEY (trainee_id) REFERENCES user(userid),
            INDEX idx_trainer (trainer_id),
            INDEX idx_trainee (trainee_id)
        )";
        if ($conn->query($sql)) {
            echo "   ✓ Created coaching_relationships table\n";
        } else {
            echo "   ✗ Error creating table: " . $conn->error . "\n";
        }
    } else {
        echo "   - Table already exists: coaching_relationships\n";
    }
    
    // Check and create coaching_requests table
    echo "\n3. Checking COACHING_REQUESTS table...\n";
    $result = $conn->query("SHOW TABLES LIKE 'coaching_requests'");
    if ($result->num_rows == 0) {
        $sql = "CREATE TABLE coaching_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trainer_id INT NOT NULL,
            trainee_id INT NOT NULL,
            message TEXT,
            experience_level VARCHAR(50),
            goals TEXT,
            status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL,
            FOREIGN KEY (trainer_id) REFERENCES user(userid),
            FOREIGN KEY (trainee_id) REFERENCES user(userid),
            INDEX idx_trainer (trainer_id),
            INDEX idx_status (status)
        )";
        if ($conn->query($sql)) {
            echo "   ✓ Created coaching_requests table\n";
        } else {
            echo "   ✗ Error creating table: " . $conn->error . "\n";
        }
    } else {
        echo "   - Table already exists: coaching_requests\n";
    }
    
    // Check and create trainer_program_assignments table
    echo "\n4. Checking TRAINER_PROGRAM_ASSIGNMENTS table...\n";
    $result = $conn->query("SHOW TABLES LIKE 'trainer_program_assignments'");
    if ($result->num_rows == 0) {
        $sql = "CREATE TABLE trainer_program_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coaching_relationship_id INT NOT NULL,
            program_id INT NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coaching_relationship_id) REFERENCES coaching_relationships(id),
            FOREIGN KEY (program_id) REFERENCES trainer_programs(id),
            INDEX idx_relationship (coaching_relationship_id)
        )";
        if ($conn->query($sql)) {
            echo "   ✓ Created trainer_program_assignments table\n";
        } else {
            echo "   ✗ Error creating table: " . $conn->error . "\n";
        }
    } else {
        echo "   - Table already exists: trainer_program_assignments\n";
    }
    
    // Display all tables
    echo "\n=== Current Database Tables ===\n";
    $result = $conn->query("SHOW TABLES");
    while ($row = $result->fetch_assoc()) {
        echo "   - " . array_values($row)[0] . "\n";
    }
    
    // Display user table structure
    echo "\n=== User Table Structure ===\n";
    $result = $conn->query("SHOW COLUMNS FROM user");
    while ($row = $result->fetch_assoc()) {
        echo "   " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
    
    echo "\n✓ Database update completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
