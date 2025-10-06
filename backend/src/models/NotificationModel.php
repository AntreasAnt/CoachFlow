<?php

/**
 * NotificationModel Class
 * 
 * Handles email verification tokens and notifications:
 * - Saves verification tokens with expiration times
 * - Verifies user tokens against database
 * - Updates user verification status
 * - Manages notification settings and delivery
 */

require_once '../config/Database.php';
class NotificationModel
{
    // Database fields for notifications
    private $NotificationID;
    private $NotificationType;
    private $Message;
    private $SendDate;
    private $DeliveryMethod;
    private $TimeBefore;

    private $Activate;
    // Database connection
    private $conn;
    // Initialize database connection
    public function __construct()
    {
        $this->conn = (new Database())->connect();
    }

    // Save verification token to database
    public function saveToken($email, $token)
    {

        try {

            // Token expires in 60 seconds
            $expiresAt = time() + 60;
            // Insert token details into database
            $sql = "INSERT INTO signupverification (email, token, expirytime) VALUES (?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("sss", $email, $token, $expiresAt);

            if ($stmt->execute()) {
                return true;
            }
            return false;
        } catch (\Exception $e) {
            error_log("Error saving token: " . $e->getMessage());
            return false;
        }
    }

    // Verify token and update user verification status
    public function checkMatchingToken($email, $token)
    {
        try {
            // Start database transaction
            $this->conn->begin_transaction();

            // Check for valid non-expired token
            $sql = "SELECT t.token, t.email
               FROM signupverification t 
             WHERE t.email = ? 
             AND t.expirytime > ?
                AND t.token = ?";

            $stmt = $this->conn->prepare($sql);
            $currentTime = time();
            $stmt->bind_param("sii", $email, $currentTime, $token);

            // Check if token exists
            if (!$stmt->execute()) {
                $this->conn->rollback();
                return false;
            }

            $result = $stmt->get_result();
            if ($result->num_rows === 0) {
                $this->conn->rollback();
                return false; // No valid token found
            }

            $row = $result->fetch_assoc();

            // Mark user as verified in database
            $updateSql = "UPDATE user SET isverified = 1 WHERE email = ?";
            $updateStmt = $this->conn->prepare($updateSql);
            $updateStmt->bind_param("s", $row['email']);

            if (!$updateStmt->execute()) {
                $this->conn->rollback();
                return false;
            }


            //Read from User table,UserID, privileges, username to automatically start the login session in the controller
            $sql = "SELECT userid, role, username FROM user WHERE email = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $row['email']);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();



            // If everything is successful, commit the transaction

            $this->conn->commit();
            return $user;
        } catch (\Exception $e) {
            $this->conn->rollback();
            error_log("Error checking token: " . $e->getMessage());
            return false;
        }
    }

    public function SavePasswordToken($email, $token)
    {

        try {

            //start database transaction
            $this->conn->begin_transaction();
            // Token expires in 300 seconds(5minutes)
            $expiresAt = time() + 300;
            // Insert token details into database
            $sql = "INSERT INTO resetpasstoken (email, token, expirytime) VALUES (?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("sss", $email, $token, $expiresAt);

            //set password to empty to not allow login with older password

            $updateSql = "UPDATE user SET password = '' WHERE email = ?";
            $updateStmt = $this->conn->prepare($updateSql);
            $updateStmt->bind_param("s", $email);
            if (!$updateStmt->execute()) {
                $this->conn->rollback();
                return false;
            }
            if ($stmt->execute() && $updateStmt->execute()) {
                // Commit the transaction
                $this->conn->commit();
                // Return true if token is saved successfully
                return true;
            } else {
                // Rollback the transaction if there was an error
                $this->conn->rollback();
                return false;
            }
        } catch (\Exception $e) {
            // Rollback the transaction if there was an error
            $this->conn->rollback();
            error_log("Error saving token: " . $e->getMessage());
            return false;
        }
    }

    public function checkResetPassMatchingToken($email, $token)
    {
        // Check for valid non-expired token
        $sql = "SELECT r.token, r.email
       FROM resetpasstoken r
     WHERE r.email = ? 
     AND r.expirytime > ?
        AND r.token = ?";

        $stmt = $this->conn->prepare($sql);
        $currentTime = time();
        $stmt->bind_param("sii", $email, $currentTime, $token);

        // Check if token exists
        if (!$stmt->execute()) {
            return false;
        }

        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            return false; // No valid token found
        }

        return true;
    }

    public function updateNotificationPreferences($inputData, $userID)
    {

        try {
            $notificationType = $inputData['notificationType'];


            if ($inputData['enabled'] == 'true') {
                //delete from database
                $query = "DELETE FROM userdisablednotifications 
                     WHERE userid = ? AND notificationtype = ?";

                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("is", $userID, $notificationType);
                $stmt->execute();
            } else {
                //insert into database
                $query = "INSERT INTO userdisablednotifications (userid, notificationtype) 
                     VALUES (?, ?)";
                $stmt = $this->conn->prepare($query);
                $stmt->bind_param("is", $userID, $notificationType);
                $stmt->execute();
            }
        } catch (\Exception $e) {
            error_log("Error updating notification preferences: " . $e->getMessage());
            return false;
        }

        return true;
    }

    public function fetchNotificationPreferences($userID)
    {

        try {
            $query = "SELECT notificationtype FROM userdisablednotifications WHERE userid = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userID);
            $stmt->execute();
            $result = $stmt->get_result();
            $disabledNotifications = array();
            while ($row = $result->fetch_assoc()) {
                array_push($disabledNotifications, $row['notificationtype']);
            }
            return $disabledNotifications;
        } catch (\Exception $e) {
            error_log("Error fetching notification preferences: " . $e->getMessage());
            return false;
        }
    }
}
