<?php

require_once '../config/cors.php';
require_once '../config/Auth.php';
require_once '../config/Database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Admin only
checkAuth(['admin']);

$MAX_RANGE_DAYS = 366;

$allowedDays = [7, 14, 30, 90];
$days = isset($_GET['days']) ? (int)$_GET['days'] : 14;
if (!in_array($days, $allowedDays, true)) {
    $days = 14;
}

function isValidISODate(string $value): bool {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
        return false;
    }
    $dt = DateTimeImmutable::createFromFormat('Y-m-d', $value);
    return $dt && $dt->format('Y-m-d') === $value;
}

function daysBetweenInclusive(string $start, string $end): int {
    $startDt = new DateTimeImmutable($start);
    $endDt = new DateTimeImmutable($end);
    $diffDays = (int) $startDt->diff($endDt)->format('%r%a');
    return $diffDays + 1;
}

$now = time();
$secondsDay = 86400;

$since24h = $now - $secondsDay;
$since7d = $now - (7 * $secondsDay);
$since30d = $now - (30 * $secondsDay);

$start7dDate = date('Y-m-d', strtotime('-6 days'));
$start30dDate = date('Y-m-d', strtotime('-29 days'));
$todayDate = date('Y-m-d');

$startParam = isset($_GET['start']) ? trim((string)$_GET['start']) : '';
$endParam = isset($_GET['end']) ? trim((string)$_GET['end']) : '';

$hasCustomRange = $startParam !== '' || $endParam !== '';

if ($hasCustomRange) {
    if ($startParam === '' || $endParam === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Both start and end dates are required']);
        exit();
    }

    if (!isValidISODate($startParam) || !isValidISODate($endParam)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid date format. Use YYYY-MM-DD']);
        exit();
    }

    $rangeDays = daysBetweenInclusive($startParam, $endParam);
    if ($rangeDays <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Start date must be before or equal to end date']);
        exit();
    }
    if ($rangeDays > $MAX_RANGE_DAYS) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Date range too large']);
        exit();
    }

    $startPeriodDate = $startParam;
    $endPeriodDate = $endParam;
    $days = $rangeDays;
} else {
    $startPeriodDate = date('Y-m-d', strtotime('-' . max(0, $days - 1) . ' days'));
    $endPeriodDate = $todayDate;
}

$startPeriodEpoch = strtotime($startPeriodDate . ' 00:00:00');
$endPeriodEpoch = strtotime($endPeriodDate . ' 23:59:59');

function tableExists(mysqli $conn, string $table): bool {
    // NOTE: Some MariaDB/MySQL builds do not allow placeholders in SHOW statements.
    $escaped = $conn->real_escape_string($table);
    $sql = "SHOW TABLES LIKE '{$escaped}'";
    $result = $conn->query($sql);
    return $result && $result->num_rows > 0;
}

function columnExists(mysqli $conn, string $table, string $column): bool {
    // NOTE: Some MariaDB/MySQL builds do not allow placeholders in SHOW statements.
    $escapedTable = str_replace('`', '``', $table);
    $escapedColumn = $conn->real_escape_string($column);
    $sql = "SHOW COLUMNS FROM `{$escapedTable}` LIKE '{$escapedColumn}'";
    $result = $conn->query($sql);
    return $result && $result->num_rows > 0;
}

function scalar(mysqli $conn, string $sql, string $types = '', array $params = []) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result ? $result->fetch_row() : null;
    $stmt->close();

    return $row ? $row[0] : null;
}

function rows(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }

    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $out = [];

    if ($result) {
        while ($r = $result->fetch_assoc()) {
            $out[] = $r;
        }
    }

    $stmt->close();
    return $out;
}

try {
    $database = new Database();
    $conn = $database->connect();

    $analytics = [
        'generated_at' => date('c'),
        'period' => [
            'days' => $days,
            'start' => $startPeriodDate,
            'end' => $endPeriodDate,
        ],
        'availability' => [],
        'overview' => [],
        'users' => [],
        'usage' => [],
        'commerce' => [],
        'coaching' => [],
        'content' => [],
        'messages' => [],
        'leaderboards' => [],
    ];

    // USERS
    if (tableExists($conn, 'user')) {
        $hasRegistrationDate = columnExists($conn, 'user', 'registrationdate');
        $hasLastLogin = columnExists($conn, 'user', 'lastlogin');
        $hasIsDisabled = columnExists($conn, 'user', 'isdisabled');
        $hasIsVerified = columnExists($conn, 'user', 'isverified');

        $analytics['availability']['user_registrationdate'] = $hasRegistrationDate;
        $analytics['availability']['user_lastlogin'] = $hasLastLogin;

        $totalUsers = (int) scalar($conn, 'SELECT COUNT(*) FROM user');
        $disabledUsers = $hasIsDisabled ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE isdisabled = 1') : null;
        $verifiedUsers = $hasIsVerified ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE isverified = 1') : null;

        $usersByRole = rows($conn, "SELECT role, COUNT(*) AS count FROM user GROUP BY role ORDER BY count DESC");

        $activeByRole7d = $hasLastLogin
            ? rows(
                $conn,
                'SELECT role, COUNT(*) AS count FROM user WHERE lastlogin >= ? GROUP BY role ORDER BY count DESC',
                'i',
                [$since7d]
            )
            : [];

        $newByRole30d = $hasRegistrationDate
            ? rows(
                $conn,
                'SELECT role, COUNT(*) AS count FROM user WHERE registrationdate >= ? GROUP BY role ORDER BY count DESC',
                'i',
                [$since30d]
            )
            : [];

        $new24h = $hasRegistrationDate ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE registrationdate >= ?', 'i', [$since24h]) : null;
        $new7d = $hasRegistrationDate ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE registrationdate >= ?', 'i', [$since7d]) : null;
        $new30d = $hasRegistrationDate ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE registrationdate >= ?', 'i', [$since30d]) : null;

        $newPeriod = $hasRegistrationDate
            ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE registrationdate BETWEEN ? AND ?', 'ii', [$startPeriodEpoch, $endPeriodEpoch])
            : null;

        $active24h = $hasLastLogin ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE lastlogin >= ?', 'i', [$since24h]) : null;
        $active7d = $hasLastLogin ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE lastlogin >= ?', 'i', [$since7d]) : null;
        $active30d = $hasLastLogin ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE lastlogin >= ?', 'i', [$since30d]) : null;

        $activePeriod = $hasLastLogin
            ? (int) scalar($conn, 'SELECT COUNT(*) FROM user WHERE lastlogin BETWEEN ? AND ?', 'ii', [$startPeriodEpoch, $endPeriodEpoch])
            : null;

        $activeByRolePeriod = $hasLastLogin
            ? rows(
                $conn,
                'SELECT role, COUNT(*) AS count FROM user WHERE lastlogin BETWEEN ? AND ? GROUP BY role ORDER BY count DESC',
                'ii',
                [$startPeriodEpoch, $endPeriodEpoch]
            )
            : [];

        $newByRolePeriod = $hasRegistrationDate
            ? rows(
                $conn,
                'SELECT role, COUNT(*) AS count FROM user WHERE registrationdate BETWEEN ? AND ? GROUP BY role ORDER BY count DESC',
                'ii',
                [$startPeriodEpoch, $endPeriodEpoch]
            )
            : [];

        $signupsPeriod = $hasRegistrationDate
            ? rows(
                $conn,
                "SELECT DATE(FROM_UNIXTIME(registrationdate)) AS date, COUNT(*) AS count
                 FROM user
                 WHERE DATE(FROM_UNIXTIME(registrationdate)) BETWEEN ? AND ?
                 GROUP BY DATE(FROM_UNIXTIME(registrationdate))
                 ORDER BY date ASC",
                'ss',
                [$startPeriodDate, $endPeriodDate]
            )
            : [];

        $loginsPeriod = $hasLastLogin
            ? rows(
                $conn,
                "SELECT DATE(FROM_UNIXTIME(lastlogin)) AS date, COUNT(DISTINCT userid) AS count
                 FROM user
                 WHERE DATE(FROM_UNIXTIME(lastlogin)) BETWEEN ? AND ?
                 GROUP BY DATE(FROM_UNIXTIME(lastlogin))
                 ORDER BY date ASC",
                'ss',
                [$startPeriodDate, $endPeriodDate]
            )
            : [];

        $analytics['overview']['total_users'] = $totalUsers;
        $analytics['overview']['active_users_7d'] = $active7d;
        $analytics['overview']['new_users_7d'] = $new7d;
        $analytics['overview']['active_users_period'] = $activePeriod;
        $analytics['overview']['new_users_period'] = $newPeriod;

        $analytics['users'] = [
            'total' => $totalUsers,
            'disabled' => $disabledUsers,
            'verified' => $verifiedUsers,
            'by_role' => $usersByRole,
            'active_by_role_7d' => $activeByRole7d,
            'new_by_role_30d' => $newByRole30d,
            'active_by_role_period' => $activeByRolePeriod,
            'new_by_role_period' => $newByRolePeriod,
            'new' => [
                'last_24h' => $new24h,
                'last_7d' => $new7d,
                'last_30d' => $new30d,
                'period' => $newPeriod,
            ],
            'active' => [
                'last_24h' => $active24h,
                'last_7d' => $active7d,
                'last_30d' => $active30d,
                'period' => $activePeriod,
            ],
            'signups_timeseries' => $signupsPeriod,
            'logins_timeseries' => $loginsPeriod,
        ];
    }

    // WORKOUT USAGE
    if (tableExists($conn, 'workout_sessions')) {
        $workoutsTotal = (int) scalar($conn, 'SELECT COUNT(*) FROM workout_sessions');
        $workouts7d = (int) scalar($conn, 'SELECT COUNT(*) FROM workout_sessions WHERE DATE(session_date) >= ?', 's', [$start7dDate]);
        $workouts30d = (int) scalar($conn, 'SELECT COUNT(*) FROM workout_sessions WHERE DATE(session_date) >= ?', 's', [$start30dDate]);
        $workoutsToday = (int) scalar($conn, 'SELECT COUNT(*) FROM workout_sessions WHERE DATE(session_date) = ?', 's', [$todayDate]);

        $activeWorkoutUsers7d = (int) scalar($conn, 'SELECT COUNT(DISTINCT user_id) FROM workout_sessions WHERE DATE(session_date) >= ?', 's', [$start7dDate]);
        $activeWorkoutUsers30d = (int) scalar($conn, 'SELECT COUNT(DISTINCT user_id) FROM workout_sessions WHERE DATE(session_date) >= ?', 's', [$start30dDate]);

        $activeWorkoutUsersPeriod = (int) scalar(
            $conn,
            'SELECT COUNT(DISTINCT user_id) FROM workout_sessions WHERE DATE(session_date) BETWEEN ? AND ?',
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $workoutsByDayPeriod = rows(
            $conn,
            "SELECT DATE(session_date) AS date, COUNT(*) AS count
             FROM workout_sessions
             WHERE DATE(session_date) BETWEEN ? AND ?
             GROUP BY DATE(session_date)
             ORDER BY date ASC",
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $analytics['usage']['workouts'] = [
            'total_sessions' => $workoutsTotal,
            'sessions_today' => $workoutsToday,
            'sessions_7d' => $workouts7d,
            'sessions_30d' => $workouts30d,
            'sessions_period' => (int) scalar($conn, 'SELECT COUNT(*) FROM workout_sessions WHERE DATE(session_date) BETWEEN ? AND ?', 'ss', [$startPeriodDate, $endPeriodDate]),
            'active_users_7d' => $activeWorkoutUsers7d,
            'active_users_30d' => $activeWorkoutUsers30d,
            'active_users_period' => $activeWorkoutUsersPeriod,
            'sessions_timeseries' => $workoutsByDayPeriod,
        ];
    }

    // NUTRITION USAGE
    if (tableExists($conn, 'food_logs')) {
        $foodLogsTotal = (int) scalar($conn, 'SELECT COUNT(*) FROM food_logs');
        $foodLogsToday = (int) scalar($conn, 'SELECT COUNT(*) FROM food_logs WHERE log_date = ?', 's', [$todayDate]);
        $foodLogs7d = (int) scalar($conn, 'SELECT COUNT(*) FROM food_logs WHERE log_date >= ?', 's', [$start7dDate]);
        $foodLogs30d = (int) scalar($conn, 'SELECT COUNT(*) FROM food_logs WHERE log_date >= ?', 's', [$start30dDate]);

        $activeNutritionUsers7d = (int) scalar($conn, 'SELECT COUNT(DISTINCT user_id) FROM food_logs WHERE log_date >= ?', 's', [$start7dDate]);
        $activeNutritionUsers30d = (int) scalar($conn, 'SELECT COUNT(DISTINCT user_id) FROM food_logs WHERE log_date >= ?', 's', [$start30dDate]);

        $activeNutritionUsersPeriod = (int) scalar(
            $conn,
            'SELECT COUNT(DISTINCT user_id) FROM food_logs WHERE log_date BETWEEN ? AND ?',
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $foodLogsByDayPeriod = rows(
            $conn,
            "SELECT log_date AS date, COUNT(*) AS count
             FROM food_logs
             WHERE log_date BETWEEN ? AND ?
             GROUP BY log_date
             ORDER BY log_date ASC",
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $analytics['usage']['nutrition'] = [
            'total_logs' => $foodLogsTotal,
            'logs_today' => $foodLogsToday,
            'logs_7d' => $foodLogs7d,
            'logs_30d' => $foodLogs30d,
            'logs_period' => (int) scalar($conn, 'SELECT COUNT(*) FROM food_logs WHERE log_date BETWEEN ? AND ?', 'ss', [$startPeriodDate, $endPeriodDate]),
            'active_users_7d' => $activeNutritionUsers7d,
            'active_users_30d' => $activeNutritionUsers30d,
            'active_users_period' => $activeNutritionUsersPeriod,
            'logs_timeseries' => $foodLogsByDayPeriod,
        ];
    }

    // MESSAGES
    if (tableExists($conn, 'messages')) {
        $messagesTotal = (int) scalar($conn, 'SELECT COUNT(*) FROM messages');
        $messages7d = (int) scalar($conn, 'SELECT COUNT(*) FROM messages WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
        $messages30d = (int) scalar($conn, 'SELECT COUNT(*) FROM messages WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
        $activeMessagers7d = (int) scalar($conn, 'SELECT COUNT(DISTINCT sender_id) FROM messages WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');

        $activeMessagersPeriod = (int) scalar(
            $conn,
            'SELECT COUNT(DISTINCT sender_id) FROM messages WHERE DATE(sent_at) BETWEEN ? AND ?',
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $messagesByDayPeriod = rows(
            $conn,
            "SELECT DATE(sent_at) AS date, COUNT(*) AS count
             FROM messages
             WHERE DATE(sent_at) BETWEEN ? AND ?
             GROUP BY DATE(sent_at)
             ORDER BY date ASC",
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $analytics['messages'] = [
            'total' => $messagesTotal,
            'sent_7d' => $messages7d,
            'sent_30d' => $messages30d,
            'sent_period' => (int) scalar($conn, 'SELECT COUNT(*) FROM messages WHERE DATE(sent_at) BETWEEN ? AND ?', 'ss', [$startPeriodDate, $endPeriodDate]),
            'active_senders_7d' => $activeMessagers7d,
            'active_senders_period' => $activeMessagersPeriod,
            'sent_timeseries' => $messagesByDayPeriod,
        ];
    }

    // PROGRAMS / CONTENT
    if (tableExists($conn, 'trainer_programs')) {
        $programsTotal = (int) scalar($conn, 'SELECT COUNT(*) FROM trainer_programs WHERE is_deleted = 0');
        $programsByStatus = rows(
            $conn,
            "SELECT status, COUNT(*) AS count
             FROM trainer_programs
             WHERE is_deleted = 0
             GROUP BY status
             ORDER BY count DESC"
        );

        $topPrograms = rows(
            $conn,
            "SELECT id, title, status, purchase_count, view_count, created_at
             FROM trainer_programs
             WHERE is_deleted = 0
             ORDER BY purchase_count DESC, view_count DESC
             LIMIT 10"
        );

        $analytics['content']['programs'] = [
            'total' => $programsTotal,
            'by_status' => $programsByStatus,
            'top_programs' => $topPrograms,
        ];
    }

    // COMMERCE
    if (tableExists($conn, 'program_purchases')) {
        $hasPurchasedAt = columnExists($conn, 'program_purchases', 'purchased_at');
        $hasCompletedAt = columnExists($conn, 'program_purchases', 'completed_at');
        $hasCreatedAt = columnExists($conn, 'program_purchases', 'created_at');

        $hasProgramId = columnExists($conn, 'program_purchases', 'program_id');
        $hasTraineeId = columnExists($conn, 'program_purchases', 'trainee_id');
        $hasTrainerId = columnExists($conn, 'program_purchases', 'trainer_id');
        $hasAmount = columnExists($conn, 'program_purchases', 'amount');
        $hasCurrency = columnExists($conn, 'program_purchases', 'currency');

        $purchaseDateExpr = $hasPurchasedAt
            ? 'purchased_at'
            : ($hasCompletedAt ? 'completed_at' : ($hasCreatedAt ? 'created_at' : 'NULL'));

        $analytics['availability']['program_purchases_date_field'] = $purchaseDateExpr;

        $purchasesTotal = (int) scalar($conn, "SELECT COUNT(*) FROM program_purchases");
        $purchasesCompleted = (int) scalar($conn, "SELECT COUNT(*) FROM program_purchases WHERE status = 'completed'");
        $purchasesPending = (int) scalar($conn, "SELECT COUNT(*) FROM program_purchases WHERE status = 'pending'");
        $purchasesFailed = (int) scalar($conn, "SELECT COUNT(*) FROM program_purchases WHERE status = 'failed'");

        $revenueTotalByCurrency = rows(
            $conn,
            "SELECT currency, ROUND(SUM(amount), 2) AS revenue
             FROM program_purchases
             WHERE status = 'completed'
             GROUP BY currency
             ORDER BY revenue DESC"
        );

        $revenue30dByCurrency = $purchaseDateExpr !== 'NULL'
            ? rows(
                $conn,
                "SELECT currency, ROUND(SUM(amount), 2) AS revenue
                 FROM program_purchases
                 WHERE status = 'completed'
                   AND DATE({$purchaseDateExpr}) >= ?
                 GROUP BY currency
                 ORDER BY revenue DESC",
                's',
                [$start30dDate]
            )
            : [];

                $purchasesByDayPeriod = $purchaseDateExpr !== 'NULL'
            ? rows(
                $conn,
                "SELECT DATE({$purchaseDateExpr}) AS date, COUNT(*) AS count, ROUND(SUM(amount), 2) AS revenue
                 FROM program_purchases
                 WHERE status = 'completed'
                                     AND DATE({$purchaseDateExpr}) BETWEEN ? AND ?
                 GROUP BY DATE({$purchaseDateExpr})
                 ORDER BY date ASC",
                                'ss',
                                [$startPeriodDate, $endPeriodDate]
            )
            : [];

                $revenuePeriodByCurrency = $purchaseDateExpr !== 'NULL'
                        ? rows(
                                $conn,
                                "SELECT currency, ROUND(SUM(amount), 2) AS revenue
                                 FROM program_purchases
                                 WHERE status = 'completed'
                                     AND DATE({$purchaseDateExpr}) BETWEEN ? AND ?
                                 GROUP BY currency
                                 ORDER BY revenue DESC",
                                'ss',
                                [$startPeriodDate, $endPeriodDate]
                        )
                        : [];

        $analytics['overview']['gmv_30d_by_currency'] = $revenue30dByCurrency;

        $analytics['commerce'] = [
            'purchases' => [
                'total' => $purchasesTotal,
                'completed' => $purchasesCompleted,
                'pending' => $purchasesPending,
                'failed' => $purchasesFailed,
            ],
            'revenue_total_by_currency' => $revenueTotalByCurrency,
            'revenue_30d_by_currency' => $revenue30dByCurrency,
            'revenue_period_by_currency' => $revenuePeriodByCurrency,
            'purchases_timeseries' => $purchasesByDayPeriod,
        ];

        // LEADERBOARDS (range-filtered)
        $canJoinPrograms = tableExists($conn, 'trainer_programs')
            && columnExists($conn, 'trainer_programs', 'id')
            && columnExists($conn, 'trainer_programs', 'title')
            && columnExists($conn, 'trainer_programs', 'trainer_id');

        $canJoinUsers = tableExists($conn, 'user') && columnExists($conn, 'user', 'userid');
        $userNameExpr = $canJoinUsers && columnExists($conn, 'user', 'full_name') ? 'u.full_name' : 'NULL';
        $userEmailExpr = $canJoinUsers && columnExists($conn, 'user', 'email') ? 'u.email' : 'NULL';

        $leaderboards = [];

        // Top programs by sales in selected range (with coach)
        if ($purchaseDateExpr !== 'NULL' && $hasProgramId && $hasAmount && $hasCurrency && $canJoinPrograms) {
            $leaderboards['top_programs_by_sales_period'] = rows(
                $conn,
                "SELECT
                    tp.id AS program_id,
                    tp.title AS program_title,
                    tp.trainer_id AS trainer_id,
                    {$userNameExpr} AS trainer_name,
                    {$userEmailExpr} AS trainer_email,
                    COUNT(pp.id) AS sales_count,
                    ROUND(SUM(pp.amount), 2) AS revenue_total,
                    COUNT(DISTINCT pp.currency) AS currency_count,
                    MIN(pp.currency) AS currency
                 FROM program_purchases pp
                 JOIN trainer_programs tp ON pp.program_id = tp.id
                 " . ($canJoinUsers ? "LEFT JOIN user u ON u.userid = tp.trainer_id" : "") . "
                 WHERE pp.status = 'completed'
                   AND DATE({$purchaseDateExpr}) BETWEEN ? AND ?
                 GROUP BY tp.id, tp.title, tp.trainer_id" . ($canJoinUsers ? ", {$userNameExpr}, {$userEmailExpr}" : "") . "
                 ORDER BY sales_count DESC, revenue_total DESC
                 LIMIT 10",
                'ss',
                [$startPeriodDate, $endPeriodDate]
            );
        }

        // Top coaches by sales in selected range
        if ($purchaseDateExpr !== 'NULL' && $hasTrainerId && $hasAmount && $hasCurrency) {
            $leaderboards['top_trainers_by_sales_period'] = rows(
                $conn,
                "SELECT
                    pp.trainer_id AS trainer_id,
                    {$userNameExpr} AS trainer_name,
                    {$userEmailExpr} AS trainer_email,
                    COUNT(pp.id) AS sales_count,
                    ROUND(SUM(pp.amount), 2) AS revenue_total,
                    COUNT(DISTINCT pp.currency) AS currency_count,
                    MIN(pp.currency) AS currency
                 FROM program_purchases pp
                 " . ($canJoinUsers ? "LEFT JOIN user u ON u.userid = pp.trainer_id" : "") . "
                 WHERE pp.status = 'completed'
                   AND DATE({$purchaseDateExpr}) BETWEEN ? AND ?
                 GROUP BY pp.trainer_id" . ($canJoinUsers ? ", {$userNameExpr}, {$userEmailExpr}" : "") . "
                 ORDER BY sales_count DESC, revenue_total DESC
                 LIMIT 10",
                'ss',
                [$startPeriodDate, $endPeriodDate]
            );
        }

        // Top users by purchases in selected range
        if ($purchaseDateExpr !== 'NULL' && $hasTraineeId && $hasAmount && $hasCurrency) {
            $traineeNameExpr = $canJoinUsers && columnExists($conn, 'user', 'full_name') ? 'tu.full_name' : 'NULL';
            $traineeEmailExpr = $canJoinUsers && columnExists($conn, 'user', 'email') ? 'tu.email' : 'NULL';
            $traineeRoleExpr = $canJoinUsers && columnExists($conn, 'user', 'role') ? 'tu.role' : 'NULL';

            $leaderboards['top_users_by_purchases_period'] = rows(
                $conn,
                "SELECT
                    pp.trainee_id AS user_id,
                    {$traineeNameExpr} AS user_name,
                    {$traineeEmailExpr} AS user_email,
                    {$traineeRoleExpr} AS user_role,
                    COUNT(pp.id) AS purchase_count,
                    ROUND(SUM(pp.amount), 2) AS spent_total,
                    COUNT(DISTINCT pp.currency) AS currency_count,
                    MIN(pp.currency) AS currency
                 FROM program_purchases pp
                 " . ($canJoinUsers ? "LEFT JOIN user tu ON tu.userid = pp.trainee_id" : "") . "
                 WHERE pp.status = 'completed'
                   AND DATE({$purchaseDateExpr}) BETWEEN ? AND ?
                 GROUP BY pp.trainee_id" . ($canJoinUsers ? ", {$traineeNameExpr}, {$traineeEmailExpr}, {$traineeRoleExpr}" : "") . "
                 ORDER BY purchase_count DESC, spent_total DESC
                 LIMIT 10",
                'ss',
                [$startPeriodDate, $endPeriodDate]
            );
        }

        if (!empty($leaderboards)) {
            $analytics['leaderboards'] = array_merge($analytics['leaderboards'], $leaderboards);
        }
    }

    // COACHING
    if (tableExists($conn, 'coaching_requests')) {
        $requestsByStatus = rows(
            $conn,
            "SELECT status, COUNT(*) AS count
             FROM coaching_requests
             GROUP BY status
             ORDER BY count DESC"
        );

        $requestsPeriod = rows(
            $conn,
            "SELECT DATE(created_at) AS date, COUNT(*) AS count
             FROM coaching_requests
             WHERE DATE(created_at) BETWEEN ? AND ?
             GROUP BY DATE(created_at)
             ORDER BY date ASC",
            'ss',
            [$startPeriodDate, $endPeriodDate]
        );

        $analytics['coaching']['requests'] = [
            'by_status' => $requestsByStatus,
            'requests_timeseries' => $requestsPeriod,
        ];
    }

    if (tableExists($conn, 'coaching_relationships')) {
        $hasTrainerIdRel = columnExists($conn, 'coaching_relationships', 'trainer_id');
        $hasStatusRel = columnExists($conn, 'coaching_relationships', 'status');
        $hasStartedAtRel = columnExists($conn, 'coaching_relationships', 'started_at');

        $relationshipsByStatus = rows(
            $conn,
            "SELECT status, COUNT(*) AS count
             FROM coaching_relationships
             GROUP BY status
             ORDER BY count DESC"
        );

        $activeRelationships = (int) scalar($conn, "SELECT COUNT(*) FROM coaching_relationships WHERE status = 'active'");

        $analytics['coaching']['relationships'] = [
            'active' => $activeRelationships,
            'by_status' => $relationshipsByStatus,
        ];

        $analytics['overview']['active_coaching_relationships'] = $activeRelationships;

        // LEADERBOARDS: Coaches with most connections
        if ($hasTrainerIdRel && $hasStatusRel) {
            $canJoinUsers = tableExists($conn, 'user') && columnExists($conn, 'user', 'userid');
            $trainerNameExpr = $canJoinUsers && columnExists($conn, 'user', 'full_name') ? 'u.full_name' : 'NULL';
            $trainerEmailExpr = $canJoinUsers && columnExists($conn, 'user', 'email') ? 'u.email' : 'NULL';

            $topCoachesByConnections = rows(
                $conn,
                "SELECT
                    cr.trainer_id AS trainer_id,
                    {$trainerNameExpr} AS trainer_name,
                    {$trainerEmailExpr} AS trainer_email,
                    SUM(CASE WHEN cr.status = 'active' THEN 1 ELSE 0 END) AS active_connections,
                    COUNT(*) AS total_connections
                 FROM coaching_relationships cr
                 " . ($canJoinUsers ? "LEFT JOIN user u ON u.userid = cr.trainer_id" : "") . "
                 GROUP BY cr.trainer_id" . ($canJoinUsers ? ", {$trainerNameExpr}, {$trainerEmailExpr}" : "") . "
                 ORDER BY active_connections DESC, total_connections DESC
                 LIMIT 10"
            );

            $analytics['leaderboards']['top_trainers_by_connections'] = $topCoachesByConnections;

            if ($hasStartedAtRel) {
                $topCoachesByNewConnections = rows(
                    $conn,
                    "SELECT
                        cr.trainer_id AS trainer_id,
                        {$trainerNameExpr} AS trainer_name,
                        {$trainerEmailExpr} AS trainer_email,
                        COUNT(*) AS connections_started
                     FROM coaching_relationships cr
                     " . ($canJoinUsers ? "LEFT JOIN user u ON u.userid = cr.trainer_id" : "") . "
                     WHERE DATE(cr.started_at) BETWEEN ? AND ?
                     GROUP BY cr.trainer_id" . ($canJoinUsers ? ", {$trainerNameExpr}, {$trainerEmailExpr}" : "") . "
                     ORDER BY connections_started DESC
                     LIMIT 10",
                    'ss',
                    [$startPeriodDate, $endPeriodDate]
                );

                $analytics['leaderboards']['top_trainers_by_new_connections_period'] = $topCoachesByNewConnections;
            }
        }
    }

    echo json_encode([
        'success' => true,
        'analytics' => $analytics,
    ]);

} catch (Exception $e) {
    error_log('GetAdminAnalytics error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load admin analytics',
    ]);
}
