<?php
require_once '../config/Database.php';

$database = new Database();
$conn = $database->connect();

// Create program_assignments table if it doesn't exist
$sql = "CREATE TABLE IF NOT EXISTS program_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trainer_id INT NOT NULL,
    trainee_id INT NOT NULL,
    program_id INT NOT NULL,
    assigned_at DATETIME NOT NULL,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trainee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES premium_workout_plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (trainer_id, trainee_id, program_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($sql)) {
    echo "program_assignments table created/verified successfully\n";
} else {
    echo "Error: " . $conn->error . "\n";
}

$conn->close();
