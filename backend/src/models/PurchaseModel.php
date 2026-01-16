<?php
if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * PurchaseModel Class
 * 
 * Handles all database operations for program purchases including:
 * - Creating and updating purchase records
 * - Getting purchased programs for trainees
 * - Verifying purchase access
 */

require_once '../config/Database.php';

class PurchaseModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Create a new purchase record (pending status)
     */
    public function createPurchase($traineeId, $programId, $amount, $currency = 'USD')
    {
        try {
            // Get trainer_id from program
            $programQuery = "SELECT trainer_id FROM trainer_programs WHERE id = ?";
            $programStmt = $this->conn->prepare($programQuery);
            $programStmt->bind_param("i", $programId);
            $programStmt->execute();
            $programResult = $programStmt->get_result();

            if ($programResult->num_rows === 0) {
                throw new Exception("Program not found");
            }

            $program = $programResult->fetch_assoc();
            $trainerId = $program['trainer_id'];

            // Create purchase record
            $query = "INSERT INTO program_purchases (
                        trainee_id, program_id, trainer_id,
                        amount, currency, status, created_at
                      ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("iiids", $traineeId, $programId, $trainerId, $amount, $currency);

            if (!$stmt->execute()) {
                throw new Exception("Failed to create purchase: " . $stmt->error);
            }

            return $this->conn->insert_id;

        } catch (Exception $e) {
            error_log("Error in createPurchase: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update purchase with Stripe payment intent ID
     */
    public function updatePurchasePaymentIntent($purchaseId, $stripePaymentIntentId)
    {
        try {
            $query = "UPDATE program_purchases 
                      SET stripe_payment_intent_id = ?,
                          status = 'processing',
                          updated_at = NOW()
                      WHERE id = ?";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("si", $stripePaymentIntentId, $purchaseId);

            return $stmt->execute();

        } catch (Exception $e) {
            error_log("Error in updatePurchasePaymentIntent: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Complete a purchase (called from webhook)
     */
    public function completePurchase($stripePaymentIntentId, $paymentMethod = null)
    {
        try {
            $this->conn->begin_transaction();

            // Update purchase status
            $query = "UPDATE program_purchases 
                      SET status = 'completed',
                          access_granted = TRUE,
                          completed_at = NOW(),
                          purchased_at = NOW(),
                          stripe_payment_method = ?,
                          updated_at = NOW()
                      WHERE stripe_payment_intent_id = ?";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ss", $paymentMethod, $stripePaymentIntentId);

            if (!$stmt->execute()) {
                throw new Exception("Failed to complete purchase");
            }

            if ($stmt->affected_rows === 0) {
                throw new Exception("Purchase not found for payment intent: " . $stripePaymentIntentId);
            }

            // Get purchase details to update program stats
            $getPurchaseQuery = "SELECT program_id FROM program_purchases WHERE stripe_payment_intent_id = ?";
            $getPurchaseStmt = $this->conn->prepare($getPurchaseQuery);
            $getPurchaseStmt->bind_param("s", $stripePaymentIntentId);
            $getPurchaseStmt->execute();
            $result = $getPurchaseStmt->get_result();
            $purchase = $result->fetch_assoc();

            // Update program purchase count
            $updateProgramQuery = "UPDATE trainer_programs 
                                  SET purchase_count = purchase_count + 1
                                  WHERE id = ?";
            $updateProgramStmt = $this->conn->prepare($updateProgramQuery);
            $updateProgramStmt->bind_param("i", $purchase['program_id']);
            $updateProgramStmt->execute();

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Error in completePurchase: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Fail a purchase
     */
    public function failPurchase($stripePaymentIntentId)
    {
        try {
            $query = "UPDATE program_purchases 
                      SET status = 'failed',
                          updated_at = NOW()
                      WHERE stripe_payment_intent_id = ?";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("s", $stripePaymentIntentId);

            return $stmt->execute();

        } catch (Exception $e) {
            error_log("Error in failPurchase: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get trainee's purchased programs
     */
    public function getTraineePurchases($traineeId, $status = 'completed')
    {
        try {
            $query = "SELECT 
                        pp.id as purchase_id,
                        pp.purchased_at,
                        pp.amount,
                        pp.currency,
                        pp.status,
                        tp.id as program_id,
                        tp.title,
                        tp.description,
                        tp.difficulty_level,
                        tp.duration_weeks,
                        tp.category,
                        u.first_name as trainer_first_name,
                        u.last_name as trainer_last_name,
                        u.id as trainer_id
                      FROM program_purchases pp
                      JOIN trainer_programs tp ON pp.program_id = tp.id
                      JOIN users u ON pp.trainer_id = u.id
                      WHERE pp.trainee_id = ? AND pp.status = ?
                      ORDER BY pp.purchased_at DESC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("is", $traineeId, $status);
            $stmt->execute();
            $result = $stmt->get_result();

            $purchases = [];
            while ($row = $result->fetch_assoc()) {
                $purchases[] = $row;
            }

            return $purchases;

        } catch (Exception $e) {
            error_log("Error in getTraineePurchases: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check if trainee owns a program
     */
    public function hasAccess($traineeId, $programId)
    {
        try {
            $query = "SELECT id 
                      FROM program_purchases 
                      WHERE trainee_id = ? 
                      AND program_id = ? 
                      AND status = 'completed'
                      AND access_granted = TRUE";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ii", $traineeId, $programId);
            $stmt->execute();
            $result = $stmt->get_result();

            return $result->num_rows > 0;

        } catch (Exception $e) {
            error_log("Error in hasAccess: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get purchase by Stripe payment intent
     */
    public function getPurchaseByPaymentIntent($stripePaymentIntentId)
    {
        try {
            $query = "SELECT * FROM program_purchases WHERE stripe_payment_intent_id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("s", $stripePaymentIntentId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                return null;
            }

            return $result->fetch_assoc();

        } catch (Exception $e) {
            error_log("Error in getPurchaseByPaymentIntent: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get trainer's sales
     */
    public function getTrainerSales($trainerId)
    {
        try {
            $query = "SELECT 
                        pp.id,
                        pp.purchased_at,
                        pp.amount,
                        pp.currency,
                        tp.title as program_title,
                        u.first_name as trainee_first_name,
                        u.last_name as trainee_last_name,
                        u.email as trainee_email
                      FROM program_purchases pp
                      JOIN trainer_programs tp ON pp.program_id = tp.id
                      JOIN users u ON pp.trainee_id = u.id
                      WHERE pp.trainer_id = ? AND pp.status = 'completed'
                      ORDER BY pp.purchased_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $trainerId);
            $stmt->execute();
            $result = $stmt->get_result();

            $sales = [];
            while ($row = $result->fetch_assoc()) {
                $sales[] = $row;
            }

            return $sales;

        } catch (Exception $e) {
            error_log("Error in getTrainerSales: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get trainer's revenue statistics
     */
    public function getTrainerRevenue($trainerId)
    {
        try {
            $query = "SELECT 
                        COUNT(*) as total_sales,
                        SUM(amount) as total_revenue,
                        AVG(amount) as average_sale,
                        currency
                      FROM program_purchases
                      WHERE trainer_id = ? AND status = 'completed'
                      GROUP BY currency";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $trainerId);
            $stmt->execute();
            $result = $stmt->get_result();

            $revenue = [];
            while ($row = $result->fetch_assoc()) {
                $revenue[] = $row;
            }

            return $revenue;

        } catch (Exception $e) {
            error_log("Error in getTrainerRevenue: " . $e->getMessage());
            throw $e;
        }
    }
}
