<?php
define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();
    
    $query = "SHOW COLUMNS FROM user";
    $result = $conn->query($query);
    
    if ($result) {
        echo "User table columns:\n";
        while ($row = $result->fetch_assoc()) {
            echo "Column: " . $row['Field'] . " | Type: " . $row['Type'] . "\n";
        }
    } else {
        echo "Query failed: " . $conn->error . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
