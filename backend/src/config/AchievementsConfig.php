<?php
if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * Achievements & Gamification Configuration
 * 
 * Defines all available achievements, badges, and milestones
 */

class AchievementsConfig
{
    // Achievement types
    const TYPE_PERSONAL_RECORD = 'personal_record';
    const TYPE_CONSISTENCY = 'consistency';
    const TYPE_VOLUME = 'volume';
    const TYPE_STRENGTH = 'strength';
    const TYPE_BODY_COMPOSITION = 'body_composition';
    const TYPE_MILESTONE = 'milestone';

    /**
     * Get all achievement definitions
     */
    public static function getAchievements()
    {
        return [
            // Personal Record Achievements
            'first_pr' => [
                'type' => self::TYPE_PERSONAL_RECORD,
                'name' => 'First PR!',
                'description' => 'Set your first personal record',
                'icon' => 'bi-trophy-fill',
                'color' => 'text-warning'
            ],
            'pr_5_exercises' => [
                'type' => self::TYPE_PERSONAL_RECORD,
                'name' => 'PR Master',
                'description' => 'Set PRs in 5 different exercises',
                'icon' => 'bi-star-fill',
                'color' => 'text-warning'
            ],
            'pr_10_exercises' => [
                'type' => self::TYPE_PERSONAL_RECORD,
                'name' => 'PR Legend',
                'description' => 'Set PRs in 10 different exercises',
                'icon' => 'bi-award-fill',
                'color' => 'text-danger'
            ],

            // Consistency Achievements (Streaks)
            'streak_7_days' => [
                'type' => self::TYPE_CONSISTENCY,
                'name' => '7-Day Warrior',
                'description' => 'Train for 7 consecutive days',
                'icon' => 'bi-fire',
                'color' => 'text-danger'
            ],
            'streak_30_days' => [
                'type' => self::TYPE_CONSISTENCY,
                'name' => 'Month of Iron',
                'description' => 'Train for 30 consecutive days',
                'icon' => 'bi-calendar-check-fill',
                'color' => 'text-danger'
            ],
            'streak_100_days' => [
                'type' => self::TYPE_CONSISTENCY,
                'name' => 'Century Club',
                'description' => 'Train for 100 consecutive days',
                'icon' => 'bi-trophy-fill',
                'color' => 'text-danger'
            ],
            'workouts_50' => [
                'type' => self::TYPE_CONSISTENCY,
                'name' => '50 Workouts',
                'description' => 'Complete 50 total workouts',
                'icon' => 'bi-check2-circle',
                'color' => 'text-primary'
            ],
            'workouts_100' => [
                'type' => self::TYPE_CONSISTENCY,
                'name' => '100 Workouts',
                'description' => 'Complete 100 total workouts',
                'icon' => 'bi-check2-all',
                'color' => 'text-primary'
            ],
            'workouts_500' => [
                'type' => self::TYPE_CONSISTENCY,
                'name' => '500 Club',
                'description' => 'Complete 500 total workouts',
                'icon' => 'bi-gem',
                'color' => 'text-purple'
            ],

            // Volume Achievements
            'volume_1000kg' => [
                'type' => self::TYPE_VOLUME,
                'name' => '1 Ton Warrior',
                'description' => 'Lift 1,000kg in a single workout',
                'icon' => 'bi-box-seam-fill',
                'color' => 'text-success'
            ],
            'volume_5000kg' => [
                'type' => self::TYPE_VOLUME,
                'name' => '5 Ton Beast',
                'description' => 'Lift 5,000kg in a single workout',
                'icon' => 'bi-lightning-fill',
                'color' => 'text-warning'
            ],
            'volume_10000kg' => [
                'type' => self::TYPE_VOLUME,
                'name' => '10 Ton Titan',
                'description' => 'Lift 10,000kg in a single workout',
                'icon' => 'bi-award-fill',
                'color' => 'text-danger'
            ],
            'volume_100000kg_total' => [
                'type' => self::TYPE_VOLUME,
                'name' => '100 Ton Legend',
                'description' => 'Lift 100,000kg total (all time)',
                'icon' => 'bi-gem',
                'color' => 'text-purple'
            ],

            // Strength Milestones (1RM based on bodyweight)
            'squat_1x_bodyweight' => [
                'type' => self::TYPE_STRENGTH,
                'name' => 'Squat: 1x Bodyweight',
                'description' => 'Squat your own bodyweight',
                'icon' => 'bi-chevron-double-up',
                'color' => 'text-info'
            ],
            'squat_2x_bodyweight' => [
                'type' => self::TYPE_STRENGTH,
                'name' => 'Squat: 2x Bodyweight',
                'description' => 'Squat 2x your bodyweight',
                'icon' => 'bi-lightning-charge-fill',
                'color' => 'text-warning'
            ],
            'bench_1x_bodyweight' => [
                'type' => self::TYPE_STRENGTH,
                'name' => 'Bench: 1x Bodyweight',
                'description' => 'Bench press your bodyweight',
                'icon' => 'bi-chevron-double-up',
                'color' => 'text-info'
            ],
            'bench_15x_bodyweight' => [
                'type' => self::TYPE_STRENGTH,
                'name' => 'Bench: 1.5x Bodyweight',
                'description' => 'Bench press 1.5x your bodyweight',
                'icon' => 'bi-lightning-charge-fill',
                'color' => 'text-warning'
            ],
            'deadlift_2x_bodyweight' => [
                'type' => self::TYPE_STRENGTH,
                'name' => 'Deadlift: 2x Bodyweight',
                'description' => 'Deadlift 2x your bodyweight',
                'icon' => 'bi-chevron-double-up',
                'color' => 'text-info'
            ],
            'deadlift_25x_bodyweight' => [
                'type' => self::TYPE_STRENGTH,
                'name' => 'Deadlift: 2.5x Bodyweight',
                'description' => 'Deadlift 2.5x your bodyweight',
                'icon' => 'bi-lightning-charge-fill',
                'color' => 'text-warning'
            ],

            // Body Composition
            'first_measurement' => [
                'type' => self::TYPE_BODY_COMPOSITION,
                'name' => 'Progress Tracker',
                'description' => 'Log your first body measurements',
                'icon' => 'bi-rulers',
                'color' => 'text-primary'
            ],
            'weight_loss_5kg' => [
                'type' => self::TYPE_BODY_COMPOSITION,
                'name' => '5kg Down',
                'description' => 'Lose 5kg from your starting weight',
                'icon' => 'bi-arrow-down-circle-fill',
                'color' => 'text-success'
            ],
            'weight_loss_10kg' => [
                'type' => self::TYPE_BODY_COMPOSITION,
                'name' => '10kg Down',
                'description' => 'Lose 10kg from your starting weight',
                'icon' => 'bi-trophy-fill',
                'color' => 'text-success'
            ],
            'muscle_gain_5kg' => [
                'type' => self::TYPE_BODY_COMPOSITION,
                'name' => '5kg Muscle',
                'description' => 'Gain 5kg of muscle mass',
                'icon' => 'bi-arrow-up-circle-fill',
                'color' => 'text-primary'
            ],

            // Milestones
            'first_workout' => [
                'type' => self::TYPE_MILESTONE,
                'name' => 'Journey Begins',
                'description' => 'Complete your first workout',
                'icon' => 'bi-play-circle-fill',
                'color' => 'text-primary'
            ],
            'first_month' => [
                'type' => self::TYPE_MILESTONE,
                'name' => 'One Month Strong',
                'description' => 'Train for your first month',
                'icon' => 'bi-calendar-check',
                'color' => 'text-info'
            ],
            'one_year' => [
                'type' => self::TYPE_MILESTONE,
                'name' => 'One Year Warrior',
                'description' => 'Train consistently for one year',
                'icon' => 'bi-calendar3',
                'color' => 'text-danger'
            ],
        ];
    }

    /**
     * Get performance alert thresholds
     */
    public static function getAlertThresholds()
    {
        return [
            'rpe_drop' => [
                'threshold' => 20, // % drop in average RPE
                'comparison_weeks' => 2, // Compare to last 2 weeks
                'severity' => 'warning',
                'title' => 'RPE Drop Detected',
                'message' => 'Your training intensity (RPE) has dropped by {percent}% compared to previous weeks. Consider if you need more recovery or if you\'re under-training.'
            ],
            'volume_drop' => [
                'threshold' => 25, // % drop in total volume
                'comparison_weeks' => 2,
                'severity' => 'warning',
                'title' => 'Volume Drop Detected',
                'message' => 'Your training volume has decreased by {percent}% compared to previous weeks. This might indicate fatigue, lack of motivation, or need for adjustment.'
            ],
            'rpe_high' => [
                'threshold' => 8.5, // Average RPE above this
                'consecutive_weeks' => 3,
                'severity' => 'info',
                'title' => 'High Training Intensity',
                'message' => 'You\'ve been training at high intensity (RPE {rpe}) for {weeks} consecutive weeks. Consider a deload week to prevent overtraining.'
            ],
            'no_workouts' => [
                'days' => 7,
                'severity' => 'info',
                'title' => 'Missing Workouts',
                'message' => 'You haven\'t logged a workout in {days} days. Stay consistent to reach your goals!'
            ]
        ];
    }

    /**
     * Get 1RM calculation formulas
     */
    public static function calculate1RM($weight, $reps, $method = 'Epley')
    {
        if ($reps == 1) return $weight;
        if ($reps > 12) return null; // Formulas unreliable above 12 reps

        switch ($method) {
            case 'Epley':
                return $weight * (1 + $reps / 30);
            case 'Brzycki':
                return $weight * (36 / (37 - $reps));
            case 'Lombardi':
                return $weight * pow($reps, 0.1);
            case 'Mayhew':
                return (100 * $weight) / (52.2 + 41.9 * exp(-0.055 * $reps));
            default:
                return $weight * (1 + $reps / 30); // Default to Epley
        }
    }
}
