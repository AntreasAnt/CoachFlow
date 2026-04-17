<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../models/ProgramModel.php';
require_once '../models/PurchaseModel.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
checkAuth(['trainer', 'trainee']);

try {
    // Get user ID and role from session
    $userId = $_SESSION['user_id'] ?? null;
    $userRole = $_SESSION['user_privileges'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User not authenticated']);
        exit();
    }

    $programModel = new ProgramModel();
    
    // Get query parameters
    $type = $_GET['type'] ?? 'marketplace'; // marketplace, my-programs, single
    $programId = $_GET['programId'] ?? $_GET['id'] ?? null;
    
    $response = ['success' => true];

    if (($type === 'single' || $programId) && $programId) {
        // Get single program details
        $includeDrafts = ($userRole === 'trainer'); // Trainers can see their drafts
        $program = $programModel->getProgramById($programId, $includeDrafts);

        // If trainee tries to open a non-published or removed program,
        // allow access only if they have purchased it.
        if (!$program && $userRole === 'trainee') {
            $purchaseModel = new PurchaseModel();
            $hasAccess = $purchaseModel->hasAccess($userId, (int)$programId);
            if ($hasAccess) {
                $program = $programModel->getProgramById((int)$programId, true, true);
            }
        }
        
        if (!$program) {
            throw new Exception('Program not found');
        }
        
        $response['program'] = $program;
        
    } elseif ($type === 'my-programs' && $userRole === 'trainer') {
        // Get trainer's programs
        $includeArchived = isset($_GET['includeArchived']) && $_GET['includeArchived'] === 'true';
        $filters = [
            'search' => $_GET['search'] ?? null,
            'limit' => isset($_GET['limit']) ? (int)$_GET['limit'] : null,
            'page' => isset($_GET['page']) ? (int)$_GET['page'] : 1
        ];
        
        $result = $programModel->getTrainerPrograms($userId, $includeArchived, $filters);
        $response['programs'] = $result['programs'];
        $response['total'] = $result['total'];
        
    } elseif ($type === 'marketplace') {
        // Get marketplace programs with filters
        $filters = [
            'search' => $_GET['search'] ?? null,
            'category' => $_GET['category'] ?? null,
            'difficulty_level' => $_GET['difficulty_level'] ?? null,
            'min_duration' => $_GET['min_duration'] ?? null,
            'max_duration' => $_GET['max_duration'] ?? null,
            'min_price' => $_GET['min_price'] ?? null,
            'max_price' => $_GET['max_price'] ?? null,
            'trainer_name' => $_GET['trainer_name'] ?? null,
            'is_featured' => $_GET['is_featured'] ?? null,
            'sort_by' => $_GET['sort_by'] ?? 'popular',
            'limit' => $_GET['limit'] ?? 20,
            'offset' => $_GET['offset'] ?? 0
        ];
        
        $result = $programModel->getMarketplacePrograms($filters);
        $response['programs'] = $result['programs'] ?? [];
        $response['total'] = $result['total'] ?? 0;
        
    } else {
        throw new Exception('Invalid request type');
    }

    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in GetPrograms.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
