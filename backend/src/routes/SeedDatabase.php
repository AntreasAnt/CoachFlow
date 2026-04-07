<?php
define('APP_RUNNING', true);
require_once dirname(__DIR__) . '/config/Database.php';

try {
    $db = new Database();
    $conn = $db->connect();
    
    echo "Starting seeding...\n";
    // Check tables
    $users = $conn->query("SELECT count(*) as c FROM user")->fetch_assoc();
    echo "Users: " . $users['c'] . "\n";
    echo "Success!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
