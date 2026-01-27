<?php
define('APP_RUNNING', true);
require_once __DIR__ . '/../config/Database.php';

$db = new Database();
$conn = $db->connect();

echo "Setting up workout program package tables...\n\n";

try {
    // Add is_program_package column to user_workout_plans table if it doesn't exist
    $conn->query("
        ALTER TABLE user_workout_plans 
        ADD COLUMN is_program_package TINYINT(1) DEFAULT 0
    ");
    echo "✓ Added is_program_package column to user_workout_plans table\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• is_program_package column already exists\n";
    } else {
        echo "⚠ Error adding is_program_package: " . $e->getMessage() . "\n";
    }
}

try {
    // Add duration_weeks column to user_workout_plans table if it doesn't exist
    $conn->query("
        ALTER TABLE user_workout_plans 
        ADD COLUMN duration_weeks INT DEFAULT 4
    ");
    echo "✓ Added duration_weeks column to user_workout_plans table\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• duration_weeks column already exists\n";
    } else {
        echo "⚠ Error adding duration_weeks: " . $e->getMessage() . "\n";
    }
}

try {
    // Add category column to user_workout_plans table if it doesn't exist
    $conn->query("
        ALTER TABLE user_workout_plans 
        ADD COLUMN category VARCHAR(50) DEFAULT 'Strength'
    ");
    echo "✓ Added category column to user_workout_plans table\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• category column already exists\n";
    } else {
        echo "⚠ Error adding category: " . $e->getMessage() . "\n";
    }
}

try {
    // Add difficulty_level column to user_workout_plans table if it doesn't exist
    $conn->query("
        ALTER TABLE user_workout_plans 
        ADD COLUMN difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner'
    ");
    echo "✓ Added difficulty_level column to user_workout_plans table\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "• difficulty_level column already exists\n";
    } else {
        echo "⚠ Error adding difficulty_level: " . $e->getMessage() . "\n";
    }
}

try {
    // Create program_workout_sessions table (rename to avoid conflict with existing workout_sessions)
    $conn->query("
        CREATE TABLE IF NOT EXISTS program_workout_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            program_package_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            week_number INT DEFAULT 1,
            day_number INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (program_package_id) REFERENCES user_workout_plans(id) ON DELETE CASCADE,
            INDEX idx_program (program_package_id),
            INDEX idx_week_day (week_number, day_number)
        )
    ");
    echo "✓ Created program_workout_sessions table\n";
} catch (Exception $e) {
    echo "• program_workout_sessions table check: " . $e->getMessage() . "\n";
}

try {
    // Create program_session_exercises table
    $conn->query("
        CREATE TABLE IF NOT EXISTS program_session_exercises (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL,
            exercise_id INT NOT NULL,
            sets INT DEFAULT 3,
            reps VARCHAR(50),
            duration VARCHAR(50),
            rpe VARCHAR(20),
            exercise_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES program_workout_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
            INDEX idx_session (session_id),
            INDEX idx_exercise (exercise_id),
            INDEX idx_order (exercise_order)
        )
    ");
    echo "✓ Created program_session_exercises table\n";
} catch (Exception $e) {
    echo "• program_session_exercises table check: " . $e->getMessage() . "\n";
}

echo "\n✅ Workout program package tables setup complete!\n";
echo "\nDatabase structure:\n";
echo "- user_workout_plans: Container for workout plans and program packages\n";
echo "- program_workout_sessions: Individual workout sessions within a program package\n";
echo "- program_session_exercises: Exercises within each session\n";
echo "- workout_plan_exercises: Exercises for single workout plans (existing)\n";
