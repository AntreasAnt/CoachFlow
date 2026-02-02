<?php
define('APP_RUNNING', true);
require_once __DIR__ . '/../config/Database.php';

$db = new Database();
$conn = $db->connect();

echo "Setting up Analytics & Gamification tables...\n\n";

// 1. Add body measurements tracking (chest, waist, hips, arms, thighs, calves)
try {
    $conn->query("
        ALTER TABLE body_measurements 
        ADD COLUMN chest_cm DECIMAL(5,2) NULL AFTER muscle_mass_kg,
        ADD COLUMN waist_cm DECIMAL(5,2) NULL AFTER chest_cm,
        ADD COLUMN hips_cm DECIMAL(5,2) NULL AFTER waist_cm,
        ADD COLUMN bicep_left_cm DECIMAL(5,2) NULL AFTER hips_cm,
        ADD COLUMN bicep_right_cm DECIMAL(5,2) NULL AFTER bicep_left_cm,
        ADD COLUMN thigh_left_cm DECIMAL(5,2) NULL AFTER bicep_right_cm,
        ADD COLUMN thigh_right_cm DECIMAL(5,2) NULL AFTER thigh_left_cm,
        ADD COLUMN calf_left_cm DECIMAL(5,2) NULL AFTER thigh_right_cm,
        ADD COLUMN calf_right_cm DECIMAL(5,2) NULL AFTER calf_left_cm
    ");
    echo "✓ Added body measurements columns\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• Body measurements columns already exist\n";
    } else {
        echo "⚠ Error adding measurements: " . $e->getMessage() . "\n";
    }
}

// 2. Add trainer tracking to workout sessions
try {
    $conn->query("
        ALTER TABLE workout_sessions 
        ADD COLUMN assigned_by_trainer_id INT NULL AFTER user_id,
        ADD COLUMN training_period_id INT NULL AFTER assigned_by_trainer_id,
        ADD FOREIGN KEY (assigned_by_trainer_id) REFERENCES user(userid) ON DELETE SET NULL
    ");
    echo "✓ Added trainer tracking to workout_sessions\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• Trainer tracking columns already exist\n";
    } else {
        echo "⚠ Error: " . $e->getMessage() . "\n";
    }
}

// 3. Add user body weight snapshot to workout sessions
try {
    $conn->query("
        ALTER TABLE workout_sessions 
        ADD COLUMN user_bodyweight_kg DECIMAL(5,2) NULL AFTER duration_minutes
    ");
    echo "✓ Added bodyweight tracking to workout_sessions\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• Bodyweight column already exists\n";
    } else {
        echo "⚠ Error: " . $e->getMessage() . "\n";
    }
}

// 4. Training periods table (for comparing performance under different trainers)
try {
    $conn->query("
        CREATE TABLE IF NOT EXISTS training_periods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            trainer_id INT NULL,
            period_name VARCHAR(100) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NULL,
            is_active TINYINT(1) DEFAULT 1,
            notes TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            FOREIGN KEY (trainer_id) REFERENCES user(userid) ON DELETE SET NULL,
            INDEX idx_user_active (user_id, is_active),
            INDEX idx_dates (start_date, end_date)
        )
    ");
    echo "✓ Created training_periods table\n";
} catch (Exception $e) {
    echo "• training_periods table: " . $e->getMessage() . "\n";
}

// 5. User achievements/badges table
try {
    $conn->query("
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_type VARCHAR(50) NOT NULL,
            achievement_name VARCHAR(100) NOT NULL,
            description TEXT NULL,
            icon VARCHAR(50) NULL,
            achieved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            value VARCHAR(50) NULL,
            metadata JSON NULL,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            INDEX idx_user (user_id),
            INDEX idx_type (achievement_type),
            INDEX idx_date (achieved_date)
        )
    ");
    echo "✓ Created user_achievements table\n";
} catch (Exception $e) {
    echo "• user_achievements table: " . $e->getMessage() . "\n";
}

// 6. User streaks table
try {
    $conn->query("
        CREATE TABLE IF NOT EXISTS user_streaks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            streak_type VARCHAR(50) NOT NULL,
            current_streak INT DEFAULT 0,
            longest_streak INT DEFAULT 0,
            last_activity_date DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            UNIQUE KEY unique_user_streak (user_id, streak_type),
            INDEX idx_user (user_id)
        )
    ");
    echo "✓ Created user_streaks table\n";
} catch (Exception $e) {
    echo "• user_streaks table: " . $e->getMessage() . "\n";
}

// 7. Performance alerts table (for RPE/volume drops)
try {
    $conn->query("
        CREATE TABLE IF NOT EXISTS performance_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            alert_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) DEFAULT 'info',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            alert_date DATE NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            dismissed TINYINT(1) DEFAULT 0,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            INDEX idx_user_unread (user_id, is_read),
            INDEX idx_date (alert_date)
        )
    ");
    echo "✓ Created performance_alerts table\n";
} catch (Exception $e) {
    echo "• performance_alerts table: " . $e->getMessage() . "\n";
}

// 8. Exercise 1RM tracking (estimated and actual)
try {
    $conn->query("
        CREATE TABLE IF NOT EXISTS exercise_1rm_tracking (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            exercise_name VARCHAR(255) NOT NULL,
            estimated_1rm DECIMAL(6,2) NOT NULL,
            calculation_method VARCHAR(50) DEFAULT 'Epley',
            based_on_weight DECIMAL(5,2) NOT NULL,
            based_on_reps INT NOT NULL,
            workout_session_id INT NULL,
            recorded_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE SET NULL,
            INDEX idx_user_exercise (user_id, exercise_name),
            INDEX idx_date (recorded_date)
        )
    ");
    echo "✓ Created exercise_1rm_tracking table\n";
} catch (Exception $e) {
    echo "• exercise_1rm_tracking table: " . $e->getMessage() . "\n";
}

// 9. Weekly volume summary table (for faster analytics queries)
try {
    $conn->query("
        CREATE TABLE IF NOT EXISTS weekly_volume_summary (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            week_start_date DATE NOT NULL,
            week_end_date DATE NOT NULL,
            total_workouts INT DEFAULT 0,
            total_volume_kg DECIMAL(10,2) DEFAULT 0,
            total_reps INT DEFAULT 0,
            total_sets INT DEFAULT 0,
            avg_rpe DECIMAL(3,2) NULL,
            total_duration_minutes INT DEFAULT 0,
            unique_exercises INT DEFAULT 0,
            training_period_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(userid) ON DELETE CASCADE,
            FOREIGN KEY (training_period_id) REFERENCES training_periods(id) ON DELETE SET NULL,
            UNIQUE KEY unique_user_week (user_id, week_start_date),
            INDEX idx_user_date (user_id, week_start_date)
        )
    ");
    echo "✓ Created weekly_volume_summary table\n";
} catch (Exception $e) {
    echo "• weekly_volume_summary table: " . $e->getMessage() . "\n";
}

echo "\n✅ Analytics & Gamification tables setup complete!\n\n";

echo "Database structure:\n";
echo "- body_measurements: Enhanced with detailed body measurements (chest, waist, hips, arms, thighs, calves)\n";
echo "- workout_sessions: Added trainer tracking, training period, and user bodyweight\n";
echo "- training_periods: Track coaching periods for comparison analytics\n";
echo "- user_achievements: Badges and achievements for gamification\n";
echo "- user_streaks: Workout consistency streaks\n";
echo "- performance_alerts: Automatic alerts for RPE/volume drops\n";
echo "- exercise_1rm_tracking: Track estimated 1RM progression\n";
echo "- weekly_volume_summary: Pre-calculated weekly stats for fast analytics\n";

echo "\nNext steps:\n";
echo "1. Create analytics API endpoints\n";
echo "2. Build analytics dashboard UI\n";
echo "3. Implement achievement detection logic\n";
echo "4. Add performance alert triggers\n";
