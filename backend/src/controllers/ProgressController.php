<?php

/**
 * ProgressController Class
 * 
 * Handles all progress tracking business logic including:
 * - Getting user progress data and measurements
 * - Managing body measurements and weight tracking
 * - Calculating progress trends and statistics
 */
if (!defined(constant_name: 'APP_RUNNING')) exit('No direct script access');

require_once '../models/ProgressModel.php';
require_once '../config/Auth.php';

class ProgressController
{
    private $progressModel;

    public function __construct()
    {
        $this->progressModel = new ProgressModel();
    }

    /**
     * Get user's progress data including measurements and trends
     */
    public function getProgressData($userId)
    {
        try {
            // Validate user authentication
            if (!$userId) {
                throw new Exception('User ID is required');
            }

            $response = [
                'success' => true,
                'bodyMeasurements' => [],
                'personalRecords' => [],
                'progressTrends' => [],
                'latestMeasurement' => null
            ];

            // Get body measurements
            $bodyMeasurements = $this->progressModel->getBodyMeasurements($userId);
            $response['bodyMeasurements'] = $bodyMeasurements;

            // Get personal records
            $personalRecords = $this->progressModel->getPersonalRecords($userId);
            $response['personalRecords'] = $personalRecords;

            // Get latest measurement
            if (!empty($bodyMeasurements)) {
                $response['latestMeasurement'] = $bodyMeasurements[0]; // Most recent first
            }

            // Calculate progress trends
            $progressTrends = $this->progressModel->calculateProgressTrends($userId);
            $response['progressTrends'] = $progressTrends;

            return $response;

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Add new body measurement
     */
    public function addBodyMeasurement($userId, $weight, $bodyFat = null, $muscleMass = null)
    {
        try {
            // Validate input
            if (!$userId || !$weight) {
                throw new Exception('User ID and weight are required');
            }

            // Validate weight is positive
            if ($weight <= 0) {
                throw new Exception('Weight must be greater than 0');
            }

            $result = $this->progressModel->addBodyMeasurement($userId, $weight, $bodyFat, $muscleMass);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Body measurement added successfully'
                ];
            } else {
                throw new Exception('Failed to add body measurement');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Update or add personal record
     */
    public function updatePersonalRecord($userId, $exerciseName, $recordType, $value, $unit, $improvement = null)
    {
        try {
            // Validate input
            if (!$userId || !$exerciseName || !$recordType || !$value || !$unit) {
                throw new Exception('All required fields must be provided');
            }

            // Validate record type
            $validRecordTypes = ['max_weight', 'max_reps', 'best_time', 'max_distance'];
            if (!in_array($recordType, $validRecordTypes)) {
                throw new Exception('Invalid record type');
            }

            // Validate value is positive
            if ($value <= 0) {
                throw new Exception('Record value must be greater than 0');
            }

            $result = $this->progressModel->updatePersonalRecord($userId, $exerciseName, $recordType, $value, $unit, $improvement);
            
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

    /**
     * Get progress summary for dashboard
     */
    public function getProgressSummary($userId)
    {
        try {
            // Validate user authentication
            if (!$userId) {
                throw new Exception('User ID is required');
            }

            $summary = $this->progressModel->getProgressSummary($userId);
            
            return [
                'success' => true,
                'summary' => $summary
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Delete body measurement
     */
    public function deleteBodyMeasurement($userId, $measurementId)
    {
        try {
            // Validate input
            if (!$userId || !$measurementId) {
                throw new Exception('User ID and measurement ID are required');
            }

            $result = $this->progressModel->deleteBodyMeasurement($userId, $measurementId);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Body measurement deleted successfully'
                ];
            } else {
                throw new Exception('Failed to delete body measurement');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
