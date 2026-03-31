<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../config/Database.php");

// Debug: Log session data
error_log("GetMyCoach - Session data: " . print_r($_SESSION, true));
error_log("GetMyCoach - user_id: " . ($_SESSION['user_id'] ?? 'NOT SET'));
error_log("GetMyCoach - user_privileges: " . ($_SESSION['user_privileges'] ?? 'NOT SET'));

checkAuth(['trainee']);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

try {
    $database = new Database();
    $conn = $database->connect();
    
    $trainee_id = $_SESSION['user_id'];
    
    // Get current active coaching relationship
    $query = "SELECT 
                cr.id as relationship_id,
                cr.trainer_id,
                cr.started_at,
                cr.status,
                u.username,
                u.full_name as name,
                u.email,
                                COALESCE(tp.bio, u.bio) as bio,
                                COALESCE(tp.specializations, u.specializations) as specializations,
                                COALESCE(tp.certifications, u.certifications) as certifications,
                                COALESCE(tp.experience_years, u.years_of_experience, 0) as years_of_experience,
                                COALESCE(tp.profile_image, (SELECT g.image FROM gallery g WHERE g.imageid = u.imageid LIMIT 1)) as image,
                COALESCE(urs.review_count, 0) as review_count,
                COALESCE(ROUND(urs.average_rating, 2), 0) as average_rating
              FROM coaching_relationships cr
              JOIN user u ON cr.trainer_id = u.userid
                            LEFT JOIN trainer_profiles tp ON tp.user_id = u.userid
              LEFT JOIN user_rating_stats urs ON u.userid = urs.user_id
              WHERE cr.trainee_id = ? AND cr.status = 'active'
              LIMIT 1";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $trainee_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $coach = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'has_coach' => true,
            'coach' => $coach
        ]);
    } else {
        // If no active coach, try to fetch the most recent disconnected relationship
        // so the trainee can tell who ended the relationship.
        $lastRelationship = null;
        try {
            $lastQuery = "SELECT
                            cr.id as relationship_id,
                            cr.trainer_id,
                            cr.ended_at,
                            cr.disconnected_by,
                            u.username,
                            u.full_name as name,
                            u.email
                          FROM coaching_relationships cr
                          JOIN user u ON cr.trainer_id = u.userid
                          WHERE cr.trainee_id = ?
                            AND cr.status = 'disconnected'
                          ORDER BY COALESCE(cr.ended_at, cr.started_at) DESC
                          LIMIT 1";
            $lstmt = $conn->prepare($lastQuery);
            if ($lstmt) {
                $lstmt->bind_param("i", $trainee_id);
                $lstmt->execute();
                $lres = $lstmt->get_result();
                if ($lres->num_rows > 0) {
                    $row = $lres->fetch_assoc();
                    $disconnectedByRole = 'unknown';
                    if (!empty($row['disconnected_by'])) {
                        $disconnectedByRole = ((int)$row['disconnected_by'] === (int)$row['trainer_id']) ? 'trainer' : 'trainee';
                    }
                    $lastRelationship = [
                        'relationship_id' => (int)$row['relationship_id'],
                        'trainer_id' => (int)$row['trainer_id'],
                        'trainer_name' => $row['name'] ?: $row['username'],
                        'trainer_email' => $row['email'],
                        'ended_at' => $row['ended_at'],
                        'disconnected_by_role' => $disconnectedByRole
                    ];
                }
                $lstmt->close();
            }
        } catch (Exception $inner) {
            error_log("GetMyCoach - last relationship query failed: " . $inner->getMessage());
        }

        echo json_encode([
            'success' => true,
            'has_coach' => false,
            'coach' => null,
            'last_relationship' => $lastRelationship
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    error_log("GetMyCoach error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>