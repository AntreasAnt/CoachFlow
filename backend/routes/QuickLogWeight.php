<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/config/cors.php';

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

if (!isset($data['weight']) || empty($data['weight'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Weight is required']);
    exit;
}

$userId = $_SESSION['user_id'];
$weight = floatval($data['weight']);
$bodyFat = isset($data['body_fat']) ? floatval($data['body_fat']) : null;
$muscleMass = isset($data['muscle_mass']) ? floatval($data['muscle_mass']) : null;

try {
    $db = new Database();
    $conn = $db->getConnection();

    // Insert new measurement
    $query = "INSERT INTO body_measurements 
              (user_id, measurement_date, weight_kg, body_fat_percentage, muscle_mass_kg, created_at) 
              VALUES (?, CURDATE(), ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE 
              weight_kg = VALUES(weight_kg),
              body_fat_percentage = VALUES(body_fat_percentage),
              muscle_mass_kg = VALUES(muscle_mass_kg)";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->bindParam(':weight', $weight);
    $stmt->bindParam(':body_fat', $bodyFat);
    $stmt->bindParam(':muscle_mass', $muscleMass);
    
    $stmt->execute();

    // Get weight change (compare to previous measurement)
    $changeQuery = "SELECT weight_kg FROM body_measurements 
                    WHERE user_id = :user_id 
                    AND measurement_date < CURDATE()
                    ORDER BY measurement_date DESC 
                    LIMIT 1";
    
    $stmt = $conn->prepare($changeQuery);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
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
