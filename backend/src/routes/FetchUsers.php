<?php
header('Content-Type: application/json');
include_once("../config/cors.php");
include_once("../config/Auth.php");
include_once("../models/UserModel.php");

// Allow only admin and manager
checkAuth(['admin','manager']);

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 25;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$rolesearch = isset($_GET['rolesearch']) ? $_GET['rolesearch'] : '';

$userModel = new UserModel();
$result = $userModel->fetchUsers($page, $limit, $search, $rolesearch);

if ($result) {
    echo json_encode(['success' => true, 'user' => $result]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to fetch users']);
}
