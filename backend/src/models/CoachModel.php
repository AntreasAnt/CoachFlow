<?php

/**
 * CoachModel Class
 * 
 * Handles all database operations for coaches including:
 * - Getting coach profiles and data
 * - Managing coach-client relationships
 * - Handling messages between coaches and clients
 */

require_once '../config/Database.php';

class CoachModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Get user's current coach
     */
    public function getCurrentCoach($userId)
    {
        try {
            $query = "SELECT 
                        cp.user_id as id,
                        u.username as name,
                        cp.bio,
                        cp.specializations,
                        cp.certifications,
                        cp.experience_years,
                        cp.hourly_rate,
                        cp.avatar,
                        cp.average_rating,
                        cp.total_clients,
                        cp.is_verified
                      FROM coach_profiles cp
                      JOIN user u ON cp.user_id = u.userid
                      WHERE cp.is_verified = 1
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                return $result->fetch_assoc();
            }
            
            return null;

        } catch (Exception $e) {
            error_log("Error in getCurrentCoach: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get messages between user and coach
     */
    public function getMessages($userId, $coachId)
    {
        try {
            $query = "SELECT 
                        m.message_content,
                        m.sent_at,
                        m.is_read,
                        sender.username as sender_name,
                        receiver.username as receiver_name,
                        (m.sender_id = ?) as is_from_user
                      FROM messages m
                      JOIN user sender ON m.sender_id = sender.userid
                      JOIN user receiver ON m.receiver_id = receiver.userid
                      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                         OR (m.sender_id = ? AND m.receiver_id = ?)
                      ORDER BY m.sent_at ASC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("iiiii", $userId, $userId, $coachId, $coachId, $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $messages = [];
            while ($row = $result->fetch_assoc()) {
                $messages[] = $row;
            }
            
            return $messages;

        } catch (Exception $e) {
            error_log("Error in getMessages: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all available coaches
     */
    public function getAvailableCoaches()
    {
        try {
            $query = "SELECT 
                        cp.user_id as id,
                        u.username as name,
                        cp.bio,
                        cp.specializations,
                        cp.certifications,
                        cp.experience_years,
                        cp.hourly_rate,
                        cp.avatar,
                        cp.average_rating,
                        cp.total_clients,
                        cp.is_verified
                      FROM coach_profiles cp
                      JOIN user u ON cp.user_id = u.userid
                      WHERE cp.is_verified = 1
                      ORDER BY cp.average_rating DESC, cp.total_clients DESC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            
            $coaches = [];
            while ($row = $result->fetch_assoc()) {
                $coaches[] = $row;
            }
            
            return $coaches;

        } catch (Exception $e) {
            error_log("Error in getAvailableCoaches: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get popular coaches for marketplace
     */
    public function getPopularCoaches()
    {
        try {
            $query = "SELECT 
                        cp.user_id as id,
                        u.username as name,
                        cp.bio,
                        cp.specializations,
                        cp.certifications,
                        cp.experience_years,
                        cp.hourly_rate,
                        cp.avatar,
                        cp.average_rating,
                        cp.total_clients,
                        cp.is_verified
                      FROM coach_profiles cp
                      JOIN user u ON cp.user_id = u.userid
                      WHERE cp.is_verified = 1
                      ORDER BY cp.average_rating DESC, cp.total_clients DESC
                      LIMIT 10";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            
            $coaches = [];
            while ($row = $result->fetch_assoc()) {
                $coaches[] = $row;
            }
            
            return $coaches;

        } catch (Exception $e) {
            error_log("Error in getPopularCoaches: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send message between users
     */
    public function sendMessage($senderId, $receiverId, $messageContent)
    {
        try {
            $query = "INSERT INTO messages (sender_id, receiver_id, message_content, sent_at, is_read) 
                      VALUES (?, ?, ?, NOW(), 0)";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("iis", $senderId, $receiverId, $messageContent);
            $result = $stmt->execute();
            
            return $result;

        } catch (Exception $e) {
            error_log("Error in sendMessage: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Hire a coach (establish coach-client relationship)
     */
    public function hireCoach($userId, $coachId)
    {
        try {
            // This could be implemented as a coach_clients table or user preference
            // For now, we'll just return true as a placeholder
            // You can extend this based on your business logic
            
            return true;

        } catch (Exception $e) {
            error_log("Error in hireCoach: " . $e->getMessage());
            throw $e;
        }
    }
}
