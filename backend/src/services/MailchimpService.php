<?php

require_once(__DIR__ . '/../bootstrap.php');

class MailchimpService
{
    public static function isConfigured(): bool
    {
        $apiKey = $_ENV['MAILCHIMP_API_KEY'] ?? null;
        if (!$apiKey) {
            return false;
        }
        if ($apiKey === 'your_mailchimp_api_key_here-us1') {
            return false;
        }
        return strpos($apiKey, '-') !== false;
    }

    /**
     * Returns a list of Mailchimp audience IDs to subscribe new signups to.
     *
     * Supported env vars:
     * - MAILCHIMP_DEFAULT_AUDIENCE_IDS: comma-separated list IDs
     * - MAILCHIMP_DEFAULT_AUDIENCE_ID: single list ID (fallback)
     */
    public static function getDefaultAudienceIds(): array
    {
        $ids = [];

        $csv = trim((string)($_ENV['MAILCHIMP_DEFAULT_AUDIENCE_IDS'] ?? ''));
        if ($csv !== '') {
            foreach (explode(',', $csv) as $part) {
                $id = trim($part);
                if ($id !== '') {
                    $ids[] = $id;
                }
            }
        }

        if (empty($ids)) {
            $single = trim((string)($_ENV['MAILCHIMP_DEFAULT_AUDIENCE_ID'] ?? ''));
            if ($single !== '') {
                $ids[] = $single;
            }
        }

        $ids = array_values(array_unique($ids));
        return $ids;
    }

    private static function getServerPrefix(string $apiKey): string
    {
        $parts = explode('-', $apiKey);
        return $parts[count($parts) - 1] ?? '';
    }

    /**
     * Upserts a member into a Mailchimp audience.
     * Uses PUT /lists/{list_id}/members/{subscriber_hash} for idempotency.
     */
    public static function upsertMember(string $audienceId, string $email, array $mergeFields = []): array
    {
        $apiKey = (string)($_ENV['MAILCHIMP_API_KEY'] ?? '');
        if (!self::isConfigured()) {
            return ['success' => false, 'message' => 'Mailchimp not configured'];
        }
        if (!function_exists('curl_init')) {
            return ['success' => false, 'message' => 'cURL not available'];
        }

        $serverPrefix = self::getServerPrefix($apiKey);
        if ($serverPrefix === '') {
            return ['success' => false, 'message' => 'Invalid Mailchimp API key'];
        }

        $emailNorm = strtolower(trim($email));
        $subscriberHash = md5($emailNorm);

        $payload = [
            'email_address' => $emailNorm,
            'status_if_new' => 'subscribed',
            'status' => 'subscribed',
        ];

        if (!empty($mergeFields)) {
            $payload['merge_fields'] = $mergeFields;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/lists/{$audienceId}/members/{$subscriberHash}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode('anystring:' . $apiKey)
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);

        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false) {
            return ['success' => false, 'message' => 'Mailchimp request failed: ' . $curlError];
        }

        $data = json_decode($response, true);

        if ($statusCode >= 200 && $statusCode < 300) {
            return ['success' => true, 'data' => $data];
        }

        $detail = is_array($data) ? ($data['detail'] ?? null) : null;
        return ['success' => false, 'message' => $detail ?: ('Mailchimp error (HTTP ' . $statusCode . ')')];
    }

    /**
     * Deletes a member from a Mailchimp audience list.
     * Uses DELETE /lists/{list_id}/members/{subscriber_hash}
     */
    public static function deleteMember(string $audienceId, string $email): array
    {
        $apiKey = (string)($_ENV['MAILCHIMP_API_KEY'] ?? '');
        if (!self::isConfigured()) {
            return ['success' => false, 'message' => 'Mailchimp not configured'];
        }
        if (!function_exists('curl_init')) {
            return ['success' => false, 'message' => 'cURL not available'];
        }

        $serverPrefix = self::getServerPrefix($apiKey);
        if ($serverPrefix === '') {
            return ['success' => false, 'message' => 'Invalid Mailchimp API key'];
        }

        $emailNorm = strtolower(trim($email));
        $subscriberHash = md5($emailNorm);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://{$serverPrefix}.api.mailchimp.com/3.0/lists/{$audienceId}/members/{$subscriberHash}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode('anystring:' . $apiKey)
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);

        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false) {
            return ['success' => false, 'message' => 'Mailchimp request failed: ' . $curlError];
        }

        // A successful DELETE usually returns 204 No Content
        if ($statusCode >= 200 && $statusCode < 300) {
            return ['success' => true];
        }

        $data = json_decode($response, true);
        $detail = (is_array($data) && isset($data['detail'])) ? $data['detail'] : null;
        
        // If 404, it might already be deleted
        if ($statusCode === 404) {
            return ['success' => true, 'message' => 'Subscriber not found or already removed'];
        }

        return ['success' => false, 'message' => $detail ?: ('Mailchimp error (HTTP ' . $statusCode . ')')];
    }

    /**
     * Subscribe a new signup to all default audiences.
     * Returns an array with success and per-audience results.
     */
    public static function subscribeSignupToDefaultAudiences(string $email, string $username = ''): array
    {
        if (!self::isConfigured()) {
            return ['success' => false, 'message' => 'Mailchimp not configured', 'results' => []];
        }

        $audienceIds = self::getDefaultAudienceIds();
        if (empty($audienceIds)) {
            return ['success' => false, 'message' => 'No default audiences configured', 'results' => []];
        }

        $mergeFields = [];
        $username = trim($username);
        if ($username !== '') {
            // Many Mailchimp lists have FNAME/LNAME; using FNAME is safe if it exists.
            $mergeFields['FNAME'] = $username;
        }

        $results = [];
        foreach ($audienceIds as $audienceId) {
            $results[$audienceId] = self::upsertMember($audienceId, $email, $mergeFields);
        }

        $anySuccess = false;
        foreach ($results as $r) {
            if (is_array($r) && ($r['success'] ?? false)) {
                $anySuccess = true;
                break;
            }
        }

        return [
            'success' => $anySuccess,
            'message' => $anySuccess ? 'Subscribed to Mailchimp default audiences' : 'Failed to subscribe to Mailchimp default audiences',
            'results' => $results,
        ];
    }
}
