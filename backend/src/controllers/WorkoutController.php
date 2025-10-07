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

            // Get all exercises (including user's custom exercises)
            $exercises = $this->workoutModel->getAllExercises($userId);
            $response['exercises'] = $exercises;

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
     * Create a custom exercise
     */
    public function createCustomExercise($userId, $exerciseData)
    {
        try {
            // Validate input
            if (!$userId || !isset($exerciseData['name'])) {
                throw new Exception('User ID and exercise name are required');
            }

            $result = $this->workoutModel->createCustomExercise($userId, $exerciseData);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Custom exercise created successfully',
                    'exerciseId' => $result
                ];
            } else {
                throw new Exception('Failed to create custom exercise');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Create a workout plan
     */
    public function createWorkoutPlan($userId, $planData)
    {
        try {
            // Validate input
            if (!$userId || !isset($planData['name']) || !isset($planData['exercises'])) {
                throw new Exception('User ID, plan name, and exercises are required');
            }

            $result = $this->workoutModel->createWorkoutPlan($userId, $planData);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Workout plan created successfully',
                    'planId' => $result
                ];
            } else {
                throw new Exception('Failed to create workout plan');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Update a workout plan
     */
    public function updateWorkoutPlan($userId, $planData)
    {
        try {
            // Validate input
            if (!$userId || !isset($planData['id'])) {
                throw new Exception('User ID and plan ID are required');
            }

            $result = $this->workoutModel->updateWorkoutPlan($userId, $planData);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Workout plan updated successfully'
                ];
            } else {
                throw new Exception('Failed to update workout plan');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete a workout plan
     */
    public function deleteWorkoutPlan($userId, $planId)
    {
        try {
            // Validate input
            if (!$userId || !$planId) {
                throw new Exception('User ID and plan ID are required');
            }

            $result = $this->workoutModel->deleteWorkoutPlan($userId, $planId);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Workout plan deleted successfully'
                ];
            } else {
                throw new Exception('Failed to delete workout plan');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get workout details for a specific session
     */
    public function getWorkoutDetails($userId, $sessionId)
    {
        try {
            // Validate input
            if (!$userId || !$sessionId) {
                throw new Exception('User ID and session ID are required');
            }

            $workoutDetails = $this->workoutModel->getWorkoutDetails($userId, $sessionId);
            
            if ($workoutDetails) {
                return [
                    'success' => true,
                    'workoutDetails' => $workoutDetails
                ];
            } else {
                throw new Exception('Workout details not found');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Save workout exercise logs
     */
    public function saveWorkoutLogs($userId, $sessionId, $logs)
    {
        try {
            // Validate input
            if (!$userId || !$sessionId || !is_array($logs)) {
                throw new Exception('User ID, session ID, and logs array are required');
            }

            $result = $this->workoutModel->saveWorkoutLogs($userId, $sessionId, $logs);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Workout logs saved successfully'
                ];
            } else {
                throw new Exception('Failed to save workout logs');
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
