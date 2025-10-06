<?php

/**
 * WorkoutController Class
 * 
 * Handles all workout-related business logic including:
 * - Getting user workout plans and sessions
 * - Managing premium workout plans
 * - Handling workout progress tracking
 */

require_once '../models/WorkoutModel.php';
require_once '../config/Auth.php';

class WorkoutController
{
    private $workoutModel;

    public function __construct()
    {
        $this->workoutModel = new WorkoutModel();
    }

    /**
     * Get user's workout data including plans, sessions, and premium plans
     */
    public function getWorkoutData($userId)
    {
        try {
            // Validate user authentication
            if (!$userId) {
                throw new Exception('User ID is required');
            }

            $response = [
                'success' => true,
                'workoutPlans' => [],
                'recentSessions' => [],
                'premiumPlans' => [],
                'personalRecords' => []
            ];

            // Get user's workout plans
            $workoutPlans = $this->workoutModel->getUserWorkoutPlans($userId);
            $response['workoutPlans'] = $workoutPlans;

            // Get recent workout sessions
            $recentSessions = $this->workoutModel->getRecentSessions($userId);
            $response['recentSessions'] = $recentSessions;

            // Get premium workout plans
            $premiumPlans = $this->workoutModel->getPremiumPlans();
            $response['premiumPlans'] = $premiumPlans;

            // Get personal records
            $personalRecords = $this->workoutModel->getPersonalRecords($userId);
            $response['personalRecords'] = $personalRecords;

            return $response;

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get premium workout plans
     */
    public function getPremiumPlans()
    {
        try {
            $plans = $this->workoutModel->getPremiumPlans();
            
            return [
                'success' => true,
                'plans' => $plans
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Create a new workout session
     */
    public function createWorkoutSession($userId, $workoutPlanId, $planName, $duration, $rating = null)
    {
        try {
            // Validate input
            if (!$userId || !$workoutPlanId || !$planName || !$duration) {
                throw new Exception('All required fields must be provided');
            }

            $result = $this->workoutModel->createWorkoutSession($userId, $workoutPlanId, $planName, $duration, $rating);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Workout session created successfully',
                    'sessionId' => $result
                ];
            } else {
                throw new Exception('Failed to create workout session');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Update personal record
     */
    public function updatePersonalRecord($userId, $exerciseName, $recordType, $value, $unit, $improvement = null)
    {
        try {
            // Validate input
            if (!$userId || !$exerciseName || !$recordType || !$value || !$unit) {
                throw new Exception('All required fields must be provided');
            }

            $result = $this->workoutModel->updatePersonalRecord($userId, $exerciseName, $recordType, $value, $unit, $improvement);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Personal record updated successfully'
                ];
            } else {
                throw new Exception('Failed to update personal record');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
