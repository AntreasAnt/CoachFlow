<?php
// Route: GetFirebaseCustomToken.php
// Purpose: Issue a Firebase custom auth token for the currently logged in PHP session user.
// Prerequisites:
//  - kreait/firebase-php installed (composer dependency)
//  - Service account credentials provided via one of:
//       * File: backend/src/config/firebase-service-account.json
//       * Env var path: FIREBASE_SERVICE_ACCOUNT=/absolute/path/to/sa.json
//       * Env var inline JSON: FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' (optionally base64 encoded)
// Security: Only works for authenticated PHP session users.


include_once("../config/cors.php");
include_once("../config/Auth.php");

// Require authentication (any logged-in user can get their own token)
checkAuth(['trainee', 'trainer']);

// Autoload + optional dotenv loading
require_once __DIR__ . '/../../vendor/autoload.php';
if (class_exists(\Dotenv\Dotenv::class)) {
    $envBase = realpath(__DIR__ . '/../../');
    if ($envBase && file_exists($envBase . '/.env')) {
        try {
            \Dotenv\Dotenv::createImmutable($envBase)->safeLoad();
        } catch (Throwable $e) {
            // Non-fatal; continue
        }
    }
}

$uid = (string)$_SESSION['user_id'];

// Resolve service account credentials prioritizing inline JSON env, then explicit path env, then default file.
$serviceAccountPath = null;
$inlineJson = getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
if ($inlineJson) {
    // Support base64 encoded content
    $maybeDecoded = base64_decode($inlineJson, true);
    if ($maybeDecoded && str_starts_with(trim($maybeDecoded), '{')) {
        $inlineJson = $maybeDecoded; // decoded JSON
    }
    if (str_starts_with(trim($inlineJson), '{')) {
        // Write to a temp file (cached per request—acceptable overhead for simplicity)
        $tmp = sys_get_temp_dir() . '/firebase_sa_' . substr(sha1($inlineJson), 0, 12) . '.json';
        if (!file_exists($tmp)) {
            file_put_contents($tmp, $inlineJson);
        }
        $serviceAccountPath = $tmp;
    }
}
if (!$serviceAccountPath) {
    $envPath = getenv('FIREBASE_SERVICE_ACCOUNT');
    if ($envPath) {
        $serviceAccountPath = $envPath;
    } else {
        $defaultPath = __DIR__ . '/../config/firebase-service-account.json';
        if (file_exists($defaultPath)) {
            $serviceAccountPath = $defaultPath;
        }
    }
}

if (!$serviceAccountPath) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'service_account_missing', 'detail' => 'No credential source resolved']);
    exit;
}
if (!file_exists($serviceAccountPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'service_account_path_invalid', 'path' => $serviceAccountPath]);
    exit;
}
if (!is_readable($serviceAccountPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'service_account_unreadable', 'path' => $serviceAccountPath]);
    exit;
}
// Basic JSON validity check
$raw = file_get_contents($serviceAccountPath);
if (!$raw || !str_starts_with(ltrim($raw), '{')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'service_account_invalid_json']);
    exit;
}

use Kreait\Firebase\Factory;

try {
    $factory = (new Factory())->withServiceAccount($serviceAccountPath);
    $auth = $factory->createAuth();

    // Add additional claims (e.g., role) for Firestore security rules
    $claims = [];
    if (isset($_SESSION['privileges'])) {
        $claims['role'] = $_SESSION['privileges'];
    }

    $customToken = $auth->createCustomToken($uid, $claims);

    echo json_encode([
        'success' => true,
        'token' => $customToken->toString(),
        'claims' => $claims,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'token_generation_failed',
        'message' => $e->getMessage(),
        'exception' => get_class($e)
    ]);
}