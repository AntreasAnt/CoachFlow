<?php

require_once '../config/cors.php';
require_once '../config/Database.php';

// This script ensures the trainer_profiles table exists
// Can be run manually or integrated into the application setup

try {
    $database = new Database();
    $conn = $database->connect();
    
    echo "Checking trainer_profiles table...\n";
    
    // Check if trainer_profiles table exists
    $result = $conn->query("SHOW TABLES LIKE 'trainer_profiles'");
    
    if ($result->num_rows == 0) {
        echo "Creating trainer_profiles table...\n";
        
        $sql = "CREATE TABLE trainer_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            bio TEXT,
            specializations JSON,
            certifications JSON,
            experience_years INT DEFAULT 0,
            hourly_rate DECIMAL(10,2) DEFAULT 0.00,
            availability_status ENUM('available', 'limited', 'unavailable') DEFAULT 'available',
            max_clients INT DEFAULT 10,
            current_clients INT DEFAULT 0,
            average_rating DECIMAL(3,2) DEFAULT 0.00,
            total_reviews INT DEFAULT 0,
            profile_image VARCHAR(255),
            verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            INDEX idx_availability (availability_status),
            INDEX idx_rating (average_rating),
            INDEX idx_rate (hourly_rate)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        if ($conn->query($sql)) {
            echo "✓ Successfully created trainer_profiles table\n";
            
            // Insert default profiles for existing trainers
            echo "Creating default profiles for existing trainers...\n";
            
            $insertSql = "INSERT INTO trainer_profiles 
                         (user_id, bio, specializations, experience_years, hourly_rate, average_rating, total_reviews, verified)
                         SELECT 
                            userid,
                            'Experienced fitness trainer ready to help you achieve your goals!',
                            JSON_ARRAY('General Fitness', 'Weight Loss', 'Muscle Building'),
                            5,
                            50.00,
                            4.5,
                            10,
                            TRUE
                         FROM user 
                         WHERE role = 'trainer'
                         AND userid NOT IN (SELECT user_id FROM trainer_profiles)";
            
            if ($conn->query($insertSql)) {
                $affected = $conn->affected_rows;
                echo "✓ Created profiles for {$affected} existing trainers\n";
            } else {
                echo "Note: Could not create default profiles: " . $conn->error . "\n";
            }
            
            echo "\nTrainer profiles setup completed successfully!\n";
            
        } else {
            echo "✗ Error creating trainer_profiles table: " . $conn->error . "\n";
        }
    } else {
        echo "✓ trainer_profiles table already exists\n";
        
        // Check if we need to add any missing columns
        $columns = $conn->query("SHOW COLUMNS FROM trainer_profiles");
        $columnNames = [];
        while ($col = $columns->fetch_assoc()) {
            $columnNames[] = $col['Field'];
        }
        
        // Add verified column if missing
        if (!in_array('verified', $columnNames)) {
            echo "Adding 'verified' column...\n";
            $conn->query("ALTER TABLE trainer_profiles ADD COLUMN verified BOOLEAN DEFAULT FALSE AFTER profile_image");
            echo "✓ Added verified column\n";
        }
        
        echo "\nAll checks completed!\n";
    }
    
    // Output JSON response for API use
    if (php_sapi_name() !== 'cli') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Trainer profiles table setup completed successfully'
        ]);
    }
    
} catch (Exception $e) {
    error_log("SetupTrainerProfiles - Error: " . $e->getMessage());
    
    if (php_sapi_name() !== 'cli') {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    } else {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
}
