<?php
define('ALLOW_INC', true);
require_once __DIR__ . '/src/config/Database.php';
// ... rest of script ...
$db = new Database();
$conn = $db->connect();
$stmt = $conn->prepare("SELECT userid FROM user WHERE username = 'maestros' OR email LIKE '%maestros%' LIMIT 1");
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$userId = $result['userid'] ?? 1;

$updateQuery = "UPDATE body_measurements 
                SET muscle_mass_kg = weight_kg * 0.4 + (RAND() * 2),
                    chest_cm = 100 + (RAND() * 10),
                    waist_cm = 85 + (RAND() * 5),
                    hips_cm = 95 + (RAND() * 5)
                WHERE user_id = ?";
$stmt2 = $conn->prepare($updateQuery);
$stmt2->bind_param('i', $userId);
$stmt2->execute();
echo "Updated measurements for user $userId. Rows affected: " . $stmt2->affected_rows . "\n";
$db = new Database();
$conn = $db->connect();
$stmt = $conn->prepare("SELECT userid FROM user WHERE username = 'maestros' OR email LIKE '%maestros%' LIMIT 1");
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$userId = $result['userid'] ?? 1;

$updateQuery = "UPDATE body_measurements 
                SET muscle_mass_kg = weight_kg * 0.4 + (RAND() * 2),
                    chest_cm = 100 + (RAND() * 10),
                    waist_cm = 85 + (RAND() * 5),
                    hips_cm = 95 + (RAND() * 5)
                WHERE user_id = ?";
$stmt2 = $conn->prepare($updateQuery);
$stmt2->bind_param('i', $userId);
$stmt2->execute();
echo "Updated measurements for user $userId. Rows affected: " . $stmt2->affected_rows . "\n";
