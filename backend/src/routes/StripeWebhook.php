<?php

require_once '../config/cors.php';
require_once '../models/PurchaseModel.php';
require_once '../config/StripeConfig.php';
require_once '../config/Database.php';

/**
 * Stripe Webhook Handler
 * 
 * CRITICAL SECURITY: This endpoint handles Stripe webhook events
 * to verify payments and complete purchases.
 * 
 * Must validate webhook signature to prevent tampering.
 */

try {
    // Get the raw POST data
    $payload = @file_get_contents('php://input');
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

    // Initialize Stripe
    StripeConfig::init();

    // Get webhook secret
    $webhookSecret = StripeConfig::getWebhookSecret();

    if (empty($webhookSecret)) {
        throw new Exception('Webhook secret not configured');
    }

    // Verify webhook signature (CRITICAL FOR SECURITY)
    try {
        $event = \Stripe\Webhook::constructEvent(
            $payload,
            $sigHeader,
            $webhookSecret
        );
    } catch (\UnexpectedValueException $e) {
        // Invalid payload
        error_log('Stripe Webhook - Invalid payload: ' . $e->getMessage());
        http_response_code(400);
        exit();
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
        // Invalid signature
        error_log('Stripe Webhook - Invalid signature: ' . $e->getMessage());
        http_response_code(400);
        exit();
    }

    // Handle the event
    $purchaseModel = new PurchaseModel();

    switch ($event->type) {
        case 'payment_intent.succeeded':
            // Payment was successful
            $paymentIntent = $event->data->object;
            $paymentIntentId = $paymentIntent->id;
            $paymentMethod = $paymentIntent->payment_method ?? null;

            error_log("Stripe Webhook - Payment succeeded: " . $paymentIntentId);

            // Complete the purchase
            try {
                $purchaseModel->completePurchase($paymentIntentId, $paymentMethod);
                error_log("Stripe Webhook - Purchase completed successfully for: " . $paymentIntentId);
            } catch (Exception $e) {
                error_log("Stripe Webhook - Error completing purchase: " . $e->getMessage());
            }
            break;

        case 'payment_intent.payment_failed':
            // Payment failed
            $paymentIntent = $event->data->object;
            $paymentIntentId = $paymentIntent->id;

            error_log("Stripe Webhook - Payment failed: " . $paymentIntentId);

            // Mark purchase as failed
            try {
                $purchaseModel->failPurchase($paymentIntentId);
            } catch (Exception $e) {
                error_log("Stripe Webhook - Error marking purchase as failed: " . $e->getMessage());
            }
            break;

        case 'charge.refunded':
            // Refund issued
            $charge = $event->data->object;
            $paymentIntentId = $charge->payment_intent;

            error_log("Stripe Webhook - Refund issued: " . $paymentIntentId);

            // Mark purchase as refunded
            try {
                $purchase = $purchaseModel->getPurchaseByPaymentIntent($paymentIntentId);
                if ($purchase) {
                    // Update to refunded status
                    $query = "UPDATE program_purchases 
                             SET status = 'refunded', 
                                 access_granted = FALSE,
                                 updated_at = NOW()
                             WHERE stripe_payment_intent_id = ?";
                    
                    $database = new Database();
                    $conn = $database->connect();
                    $stmt = $conn->prepare($query);
                    $stmt->bind_param("s", $paymentIntentId);
                    $stmt->execute();
                }
            } catch (Exception $e) {
                error_log("Stripe Webhook - Error processing refund: " . $e->getMessage());
            }
            break;

        default:
            // Unexpected event type
            error_log("Stripe Webhook - Unhandled event type: " . $event->type);
    }

    // Return success response
    http_response_code(200);
    echo json_encode(['received' => true]);

} catch (Exception $e) {
    error_log("Error in StripeWebhook.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Webhook handler error'
    ]);
}
