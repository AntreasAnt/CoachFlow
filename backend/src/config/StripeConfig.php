<?php
if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * Stripe Configuration
 * 
 * Handles Stripe API configuration and initialization
 */

require_once __DIR__ . '/../../vendor/autoload.php';

class StripeConfig
{
    private static $initialized = false;

    /**
     * Initialize Stripe with API keys
     */
    public static function init()
    {
        if (self::$initialized) {
            return;
        }

        $secretKey = $_ENV['STRIPE_SECRET_KEY'] ?? '';
        
        if (empty($secretKey)) {
            throw new Exception('Stripe secret key not configured');
        }

        \Stripe\Stripe::setApiKey($secretKey);
        self::$initialized = true;
    }

    /**
     * Get publishable key for frontend
     */
    public static function getPublishableKey()
    {
        return $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? '';
    }

    /**
     * Get webhook secret
     */
    public static function getWebhookSecret()
    {
        return $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
    }

    /**
     * Get currency
     */
    public static function getDefaultCurrency()
    {
        return $_ENV['STRIPE_CURRENCY'] ?? 'usd';
    }
}
