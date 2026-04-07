<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/Database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$userId = $_SESSION['user_id'];
$weight = isset($data['weight']) && !empty($data['weight']) ? floatval($data['weight']) : null;
$bodyFat = isset($data['body_fat']) ? floatval($data['body_fat']) : null;
$muscleMass = isset($data['muscle_mass']) ? floatval($data['muscle_mass']) : null;
$chest = isset($data['chest_cm']) ? floatval($data['chest_cm']) : null;
$waist = isset($data['waist_cm']) ? floatval($data['waist_cm']) : null;
$hips = isset($data['hips_cm']) ? floatval($data['hips_cm']) : null;

if ($weight === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Weight is required']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();

    // Insert new measurement
    $query = "INSERT INTO body_measurements 
              (user_id, measurement_date, weight_kg, body_fat_percentage, muscle_mass_kg, chest_cm, waist_cm, hips_cm)
              VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE 
              weight_kg = VALUES(weight_kg),
              body_fat_percentage = VALUES(body_fat_percentage),
              muscle_mass_kg = VALUES(muscle_mass_kg),
              chest_cm = VALUES(chest_cm),
              waist_cm = VALUES(waist_cm),
              hips_cm = VALUES(hips_cm)";

    $stmt = $conn->prepare($query);
    $stmt->bind_param('idddddd', $userId, $weight, $bodyFat, $muscleMass, $chest, $waist, $hips);
    $stmt->execute();

    // Keep profile table weight in sync with quick logs
    $userWeightStmt = $conn->prepare("UPDATE user SET weight = ? WHERE userid = ?");
    if ($userWeightStmt) {
        $userWeightStmt->bind_param('di', $weight, $userId);
        $userWeightStmt->execute();
        $userWeightStmt->close();
    }

    // Get weight change (compare to previous measurement)
    $changeQuery = "SELECT weight_kg FROM body_measurements 
                    WHERE user_id = ? 
                    AND measurement_date < CURDATE()
                    ORDER BY measurement_date DESC 
                    LIMIT 1";
    
    $stmt = $conn->prepare($changeQuery);
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    $weightChange = null;
    $changeType = 'neutral';
    
    if ($result && $result['weight_kg']) {
        $weightChange = round($weight - $result['weight_kg'], 2);
        if ($weightChange > 0) {
            $changeType = 'gain';
        } elseif ($weightChange < 0) {
            $changeType = 'loss';
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Weight logged successfully',
        'data' => [
            'current_weight' => $weight,
            'weight_change' => $weightChange,
            'change_type' => $changeType
        ]
    ]);

} catch (Exception $e) {
    error_log("QuickLogWeight Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to log weight: ' . $e->getMessage()
    ]);
}
