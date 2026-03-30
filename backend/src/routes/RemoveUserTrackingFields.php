<?php
// One-time database cleanup script
// Drops user tracking fields if they exist.

define('APP_RUNNING', true);
require_once '../config/Database.php';

try {
    $database = new Database();
    $conn = $database->connect();

    echo "=== Removing User Tracking Fields ===\n\n";

    echo "1. Checking USER table columns...\n";
    $result = $conn->query("SHOW COLUMNS FROM user");
    $existingColumns = [];
    while ($row = $result->fetch_assoc()) {
        $existingColumns[] = $row['Field'];
    }

    $columnsToDrop = [
        'trackmyself',
        'trackothers',
        'track_myself',
        'track_others'
    ];

    echo "2. Dropping tracking columns if present...\n";
    foreach ($columnsToDrop as $column) {
        if (in_array($column, $existingColumns, true)) {
            $sql = "ALTER TABLE user DROP COLUMN `$column`";
            if ($conn->query($sql)) {
                echo "   ✓ Dropped column: $column\n";
            } else {
                echo "   ✗ Error dropping $column: " . $conn->error . "\n";
            }
        } else {
            echo "   - Column not found (skipped): $column\n";
        }
    }

    echo "\n✅ Cleanup completed.\n";
    echo "\nIf you rely on tracking data elsewhere, remove those references too.\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

if (isset($conn)) {
    $conn->close();
}
?>
