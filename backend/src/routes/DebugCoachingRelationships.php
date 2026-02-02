<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $conn = $database->connect();
    
    // Check all coaching relationships
    echo "=== All Coaching Relationships ===\n\n";
    $allRelationships = $conn->query("SELECT * FROM coaching_relationships");
    
    if ($allRelationships && $allRelationships->num_rows > 0) {
        while ($row = $allRelationships->fetch_assoc()) {
            echo "ID: {$row['id']}\n";
            echo "Trainer ID: {$row['trainer_id']}\n";
            echo "Trainee ID: {$row['trainee_id']}\n";
            echo "Status: {$row['status']}\n";
            echo "Started: {$row['started_at']}\n";
            echo "---\n\n";
        }
    } else {
        echo "No coaching relationships found\n";
    }
    
    // Check user roles
    echo "\n=== Users ===\n\n";
    $users = $conn->query("SELECT userid, username, role, email FROM user WHERE role IN ('trainer', 'trainee') ORDER BY userid");
    
    if ($users && $users->num_rows > 0) {
        while ($row = $users->fetch_assoc()) {
            echo "ID: {$row['userid']} | Username: {$row['username']} | Role: {$row['role']} | Email: {$row['email']}\n";
        }
    } else {
        echo "No users found\n";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>