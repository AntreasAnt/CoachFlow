<?php

/**
 * CoachController Class
 * 
 * Handles all coach-related business logic including:
 * - Getting coach data and messages
 * - Managing coach profiles
 * - Handling coach marketplace
 */

if (!defined(constant_name: 'APP_RUNNING')) exit('No direct script access');


require_once '../models/CoachModel.php';
require_once '../config/Auth.php';

class CoachController
{
    private $coachModel;

    public function __construct()
    {
        $this->coachModel = new CoachModel();
    }

    /**
     * Get coach data including current coach, messages, and available coaches
     */
    public function getCoachData($userId)
    {
        try {
            // Validate user authentication
            if (!$userId) {
                throw new Exception('User ID is required');
            }

            $response = [
                'success' => true,
                'currentCoach' => null,
                'messages' => [],
                'availableCoaches' => []
            ];

            // Get user's current coach
            $currentCoach = $this->coachModel->getCurrentCoach($userId);
            if ($currentCoach) {
                $response['currentCoach'] = $currentCoach;
                
                // Get messages with current coach
                $messages = $this->coachModel->getMessages($userId, $currentCoach['id']);
                $response['messages'] = $messages;
            }

            // Get all available coaches
            $availableCoaches = $this->coachModel->getAvailableCoaches();
            $response['availableCoaches'] = $availableCoaches;

            return $response;

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get popular coaches for marketplace
     */
    public function getPopularCoaches()
    {
        try {
            $coaches = $this->coachModel->getPopularCoaches();
            
            return [
                'success' => true,
                'coaches' => $coaches
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Send message to coach
     */
    public function sendMessage($senderId, $receiverId, $message)
    {
        try {
            // Validate input
            if (!$senderId || !$receiverId || !$message) {
                throw new Exception('All fields are required');
            }

            $result = $this->coachModel->sendMessage($senderId, $receiverId, $message);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Message sent successfully'
                ];
            } else {
                throw new Exception('Failed to send message');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Hire a coach
     */
    public function hireCoach($userId, $coachId)
    {
        try {
            // Validate input
            if (!$userId || !$coachId) {
                throw new Exception('User ID and Coach ID are required');
            }

            $result = $this->coachModel->hireCoach($userId, $coachId);
            
            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Coach hired successfully'
                ];
            } else {
                throw new Exception('Failed to hire coach');
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
