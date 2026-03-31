<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/PurchaseModel.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainee', 'trainer']);

try {
    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $purchaseModel = new PurchaseModel();

    // Optional pagination (backwards compatible: omit page/limit => full list)
    $pageParam = $_GET['page'] ?? null;
    $limitParam = $_GET['limit'] ?? null;

    $hiddenPurchases = $purchaseModel->getTraineeHiddenPurchases($userId);

    if ($pageParam !== null || $limitParam !== null) {
        $page = $pageParam !== null ? max(1, (int)$pageParam) : 1;
        $limit = $limitParam !== null ? max(1, min(50, (int)$limitParam)) : 10;
        $offset = ($page - 1) * $limit;

        $total = $purchaseModel->countTraineePurchases($userId, 'completed', 0);
        $purchases = $purchaseModel->getTraineePurchasesPaged($userId, 'completed', $limit, $offset);

        $totalPages = (int)ceil($total / $limit);
        $pagination = [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages
        ];

        error_log("GetPurchasedPrograms(paged) for user $userId: page=$page limit=$limit returned " . count($purchases) . " purchases");

        echo json_encode([
            'success' => true,
            'purchases' => $purchases,
            'hiddenPurchases' => $hiddenPurchases,
            'purchasesPagination' => $pagination
        ]);
    } else {
        // Full list (legacy)
        $purchases = $purchaseModel->getTraineePurchases($userId, 'completed');
        error_log("GetPurchasedPrograms for user $userId: Found " . count($purchases) . " purchases, " . count($hiddenPurchases) . " hidden");

        echo json_encode([
            'success' => true,
            'purchases' => $purchases,
            'hiddenPurchases' => $hiddenPurchases
        ]);
    }

} catch (Exception $e) {
    error_log("Error in GetPurchasedPrograms.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
