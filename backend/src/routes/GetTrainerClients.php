<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer']);

try {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $database = new Database();
    $conn = $database->connect();
    
    // Get active coaching relationships with program assignment count
    $query = "SELECT 
                cr.id,
                cr.trainee_id,
                cr.started_at,
                cr.status,
                u.full_name as name,
                u.username,
                u.email,
                u.phone,
                                (SELECT g.image FROM gallery g WHERE g.imageid = u.imageid LIMIT 1) as profile_image,
                (SELECT COUNT(*) FROM program_assignments WHERE trainer_id = ? AND trainee_id = cr.trainee_id) as assigned_programs
              FROM coaching_relationships cr
              JOIN user u ON cr.trainee_id = u.userid
              WHERE cr.trainer_id = ?
              AND cr.status = 'active'
              ORDER BY cr.started_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $row['last_active'] = 'Today'; // Simplified - can be enhanced
        $row['name'] = $row['name'] ?: $row['username']; // Use username if full_name is null
        $clients[] = $row;
    }

    // Also fetch recent disconnected relationships so trainers can see who disconnected.
    // Keep these out of the main clients list to preserve existing UX.
    $recentDisconnects = [];
    try {
        $disconnectQuery = "SELECT
                              cr.id,
                              cr.trainee_id,
                              cr.ended_at,
                              cr.disconnected_by,
                              u.full_name as name,
                              u.username,
                              u.email
                            FROM coaching_relationships cr
                            JOIN user u ON cr.trainee_id = u.userid
                            WHERE cr.trainer_id = ?
                              AND cr.status = 'disconnected'
                            ORDER BY COALESCE(cr.ended_at, cr.started_at) DESC
                            LIMIT 5";
        $dstmt = $conn->prepare($disconnectQuery);
        if ($dstmt) {
            $dstmt->bind_param("i", $userId);
            $dstmt->execute();
            $dres = $dstmt->get_result();
            while ($drow = $dres->fetch_assoc()) {
                $name = $drow['name'] ?: $drow['username'];
                $disconnectedByRole = 'unknown';
                if (!empty($drow['disconnected_by'])) {
                    $disconnectedByRole = ((int)$drow['disconnected_by'] === (int)$drow['trainee_id']) ? 'trainee' : 'trainer';
                }
                $recentDisconnects[] = [
                    'relationship_id' => (int)$drow['id'],
                    'trainee_id' => (int)$drow['trainee_id'],
                    'name' => $name,
                    'email' => $drow['email'],
                    'ended_at' => $drow['ended_at'],
                    'disconnected_by_role' => $disconnectedByRole
                ];
            }
            $dstmt->close();
        }
    } catch (Exception $inner) {
        // Don't fail the whole endpoint if disconnect tracking columns aren't present.
        error_log("GetTrainerClients - recent disconnects query failed: " . $inner->getMessage());
    }

    echo json_encode([
        'success' => true,
        'clients' => $clients,
        'recent_disconnects' => $recentDisconnects
    ]);

} catch (Exception $e) {
    error_log("GetTrainerClients - Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
