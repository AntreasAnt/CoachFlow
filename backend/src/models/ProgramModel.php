<?php
if (!defined('APP_RUNNING')) exit('No direct script access');

/**
 * ProgramModel Class
 * 
 * Handles all database operations for trainer programs including:
 * - Creating, updating, and deleting programs
 * - Managing program exercises
 * - Getting program listings and details
 */

require_once '../config/Database.php';

class ProgramModel
{
    private $conn;
    
    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Create a new trainer program
     */
    public function createProgram($trainerId, $programData)
    {
        try {
            $this->conn->begin_transaction();

            // Generate slug from title
            $slug = $this->generateSlug($programData['title']);

            // Insert program
            $query = "INSERT INTO trainer_programs (
                        trainer_id, title, description, long_description,
                        meta_title, meta_description, slug, tags,
                        difficulty_level, duration_weeks, category,
                        price, currency, status
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $title = $programData['title'];
            $description = $programData['description'] ?? '';
            $longDescription = $programData['long_description'] ?? '';
            $metaTitle = $programData['meta_title'] ?? $title;
            $metaDescription = $programData['meta_description'] ?? $description;
            $tags = isset($programData['tags']) ? json_encode($programData['tags']) : json_encode([]);
            $difficultyLevel = $programData['difficulty_level'] ?? 'beginner';
            $durationWeeks = $programData['duration_weeks'] ?? 4;
            $category = $programData['category'] ?? 'General';
            $price = $programData['price'] ?? 0.00;
            $currency = $programData['currency'] ?? 'USD';
            $status = $programData['status'] ?? 'draft';

            $stmt->bind_param(
                "issssssssissds",
                $trainerId, $title, $description, $longDescription,
                $metaTitle, $metaDescription, $slug, $tags,
                $difficultyLevel, $durationWeeks, $category,
                $price, $currency, $status
            );

            if (!$stmt->execute()) {
                throw new Exception("Failed to create program: " . $stmt->error);
            }

            $programId = $this->conn->insert_id;

            // Insert exercises if provided
            if (isset($programData['exercises']) && is_array($programData['exercises'])) {
                $this->addExercisesToProgram($programId, $programData['exercises']);
            }

            // Update published_at if status is published
            if ($status === 'published') {
                $updateQuery = "UPDATE trainer_programs SET published_at = NOW() WHERE id = ?";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bind_param("i", $programId);
                $updateStmt->execute();
            }

            $this->conn->commit();
            return $programId;

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Error in createProgram: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update an existing program
     */
    public function updateProgram($trainerId, $programId, $programData)
    {
        try {
            $this->conn->begin_transaction();

            // Verify ownership
            $checkQuery = "SELECT id, status FROM trainer_programs WHERE id = ? AND trainer_id = ?";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("ii", $programId, $trainerId);
            $checkStmt->execute();
            $result = $checkStmt->get_result();

            if ($result->num_rows === 0) {
                throw new Exception("Program not found or access denied");
            }

            $existingProgram = $result->fetch_assoc();

            // Update program
            $query = "UPDATE trainer_programs SET
                        title = ?,
                        description = ?,
                        long_description = ?,
                        meta_title = ?,
                        meta_description = ?,
                        tags = ?,
                        difficulty_level = ?,
                        duration_weeks = ?,
                        category = ?,
                        price = ?,
                        currency = ?,
                        status = ?,
                        updated_at = NOW()
                      WHERE id = ? AND trainer_id = ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $title = $programData['title'];
            $description = $programData['description'] ?? '';
            $longDescription = $programData['long_description'] ?? '';
            $metaTitle = $programData['meta_title'] ?? $title;
            $metaDescription = $programData['meta_description'] ?? $description;
            $tags = isset($programData['tags']) ? json_encode($programData['tags']) : json_encode([]);
            $difficultyLevel = $programData['difficulty_level'] ?? 'beginner';
            $durationWeeks = $programData['duration_weeks'] ?? 4;
            $category = $programData['category'] ?? 'General';
            $price = $programData['price'] ?? 0.00;
            $currency = $programData['currency'] ?? 'USD';
            $status = $programData['status'] ?? 'draft';

            $stmt->bind_param(
                "sssssssissdsii",
                $title, $description, $longDescription,
                $metaTitle, $metaDescription, $tags,
                $difficultyLevel, $durationWeeks, $category,
                $price, $currency, $status,
                $programId, $trainerId
            );

            if (!$stmt->execute()) {
                throw new Exception("Failed to update program: " . $stmt->error);
            }

            // Update exercises if provided
            if (isset($programData['exercises'])) {
                // Delete existing exercises
                $deleteQuery = "DELETE FROM trainer_program_exercises WHERE program_id = ?";
                $deleteStmt = $this->conn->prepare($deleteQuery);
                $deleteStmt->bind_param("i", $programId);
                $deleteStmt->execute();

                // Add new exercises
                if (is_array($programData['exercises']) && count($programData['exercises']) > 0) {
                    $this->addExercisesToProgram($programId, $programData['exercises']);
                }
            }

            // Update published_at if status changed to published
            if ($status === 'published' && $existingProgram['status'] !== 'published') {
                $updateQuery = "UPDATE trainer_programs SET published_at = NOW() WHERE id = ?";
                $updateStmt = $this->conn->prepare($updateQuery);
                $updateStmt->bind_param("i", $programId);
                $updateStmt->execute();
            }

            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Error in updateProgram: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete a program
     */
    public function deleteProgram($trainerId, $programId)
    {
        try {
            // Verify ownership
            $checkQuery = "SELECT id FROM trainer_programs WHERE id = ? AND trainer_id = ?";
            
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bind_param("ii", $programId, $trainerId);
            $checkStmt->execute();
            $result = $checkStmt->get_result();

            if ($result->num_rows === 0) {
                throw new Exception("Program not found or access denied");
            }

            // Soft delete - set is_deleted to 1
            $query = "UPDATE trainer_programs SET is_deleted = 1 WHERE id = ? AND trainer_id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("ii", $programId, $trainerId);

            return $stmt->execute();

        } catch (Exception $e) {
            error_log("Error in deleteProgram: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get trainer's programs
     */
    public function getTrainerPrograms($trainerId, $includeArchived = false)
    {
        try {
            $query = "SELECT 
                        id, title, description, difficulty_level,
                        duration_weeks, category, price, currency,
                        status, is_featured, purchase_count,
                        rating_average, rating_count, view_count,
                        created_at, updated_at, published_at
                      FROM trainer_programs
                      WHERE trainer_id = ? AND is_deleted = 0";
            
            if (!$includeArchived) {
                $query .= " AND status != 'archived'";
            }
            
            $query .= " ORDER BY created_at DESC";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("i", $trainerId);
            $stmt->execute();
            $result = $stmt->get_result();

            $programs = [];
            while ($row = $result->fetch_assoc()) {
                $row['tags'] = json_decode($row['tags'] ?? '[]', true);
                $programs[] = $row;
            }

            return $programs;

        } catch (Exception $e) {
            error_log("Error in getTrainerPrograms: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get a single program with full details
     */
    public function getProgramById($programId, $includeDrafts = false)
    {
        try {
            $query = "SELECT 
                        tp.*,
                        u.full_name as trainer_name,
                        u.email as trainer_email
                      FROM trainer_programs tp
                      JOIN user u ON tp.trainer_id = u.userid
                      WHERE tp.id = ? AND tp.is_deleted = 0";
            
            if (!$includeDrafts) {
                $query .= " AND tp.status = 'published'";
            }

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            $stmt->bind_param("i", $programId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                return null;
            }

            $program = $result->fetch_assoc();
            $program['tags'] = json_decode($program['tags'] ?? '[]', true);

            // Get exercises
            $program['exercises'] = $this->getProgramExercises($programId);

            // Increment view count
            $updateQuery = "UPDATE trainer_programs SET view_count = view_count + 1 WHERE id = ?";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bind_param("i", $programId);
            $updateStmt->execute();

            return $program;

        } catch (Exception $e) {
            error_log("Error in getProgramById: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all published programs (marketplace)
     */
    public function getMarketplacePrograms($filters = [])
    {
        try {
            $query = "SELECT 
                        tp.id, tp.trainer_id, tp.title, tp.description,
                        tp.difficulty_level, tp.duration_weeks, tp.category,
                        tp.price, tp.currency, tp.is_featured,
                        tp.purchase_count, tp.rating_average, tp.rating_count,
                        tp.created_at, tp.published_at,
                        u.full_name as trainer_name
                      FROM trainer_programs tp
                      JOIN user u ON tp.trainer_id = u.userid
                      WHERE tp.status = 'published' AND tp.is_deleted = 0";

            $params = [];
            $types = '';

            // Apply filters
            if (!empty($filters['category'])) {
                $query .= " AND tp.category = ?";
                $params[] = $filters['category'];
                $types .= 's';
            }

            if (!empty($filters['difficulty_level'])) {
                $query .= " AND tp.difficulty_level = ?";
                $params[] = $filters['difficulty_level'];
                $types .= 's';
            }

            if (!empty($filters['max_price'])) {
                $query .= " AND tp.price <= ?";
                $params[] = $filters['max_price'];
                $types .= 'd';
            }

            if (!empty($filters['trainer_id'])) {
                $query .= " AND tp.trainer_id = ?";
                $params[] = $filters['trainer_id'];
                $types .= 'i';
            }

            // Sorting
            $sortBy = $filters['sort_by'] ?? 'popular';
            switch ($sortBy) {
                case 'newest':
                    $query .= " ORDER BY tp.published_at DESC";
                    break;
                case 'price_low':
                    $query .= " ORDER BY tp.price ASC";
                    break;
                case 'price_high':
                    $query .= " ORDER BY tp.price DESC";
                    break;
                case 'rating':
                    $query .= " ORDER BY tp.rating_average DESC, tp.rating_count DESC";
                    break;
                case 'popular':
                default:
                    $query .= " ORDER BY tp.purchase_count DESC, tp.rating_average DESC";
                    break;
            }

            // Pagination
            $limit = $filters['limit'] ?? 20;
            $offset = $filters['offset'] ?? 0;
            $query .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $types .= 'ii';

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }

            $stmt->execute();
            $result = $stmt->get_result();

            $programs = [];
            while ($row = $result->fetch_assoc()) {
                $programs[] = $row;
            }

            return $programs;

        } catch (Exception $e) {
            error_log("Error in getMarketplacePrograms: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get exercises for a program
     */
    private function getProgramExercises($programId)
    {
        try {
            $query = "SELECT 
                        tpe.*,
                        e.name, e.category, e.muscle_group,
                        e.equipment, e.instructions, e.is_custom,
                        alt.name as alternative_name
                      FROM trainer_program_exercises tpe
                      JOIN exercises e ON tpe.exercise_id = e.id
                      LEFT JOIN exercises alt ON tpe.alternative_exercise_id = alt.id
                      WHERE tpe.program_id = ?
                      ORDER BY tpe.week_number, tpe.day_number, tpe.order_index";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $programId);
            $stmt->execute();
            $result = $stmt->get_result();

            $exercises = [];
            while ($row = $result->fetch_assoc()) {
                $exercises[] = $row;
            }

            return $exercises;

        } catch (Exception $e) {
            error_log("Error in getProgramExercises: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add exercises to a program
     */
    private function addExercisesToProgram($programId, $exercises)
    {
        try {
            $query = "INSERT INTO trainer_program_exercises (
                        program_id, exercise_id, week_number, day_number,
                        order_index, sets, reps, rest_seconds, tempo,
                        rpe, notes, alternative_exercise_id
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }

            foreach ($exercises as $index => $exercise) {
                $exerciseId = $exercise['exercise_id'];
                $weekNumber = $exercise['week_number'] ?? 1;
                $dayNumber = $exercise['day_number'] ?? 1;
                $orderIndex = $exercise['order_index'] ?? $index;
                $sets = $exercise['sets'] ?? 3;
                $reps = $exercise['reps'] ?? '';
                $restSeconds = $exercise['rest_seconds'] ?? 60;
                $tempo = $exercise['tempo'] ?? '';
                $rpe = $exercise['rpe'] ?? '';
                $notes = $exercise['notes'] ?? '';
                $alternativeExerciseId = $exercise['alternative_exercise_id'] ?? null;

                $stmt->bind_param(
                    "iiiiiisisssi",
                    $programId, $exerciseId, $weekNumber, $dayNumber,
                    $orderIndex, $sets, $reps, $restSeconds, $tempo,
                    $rpe, $notes, $alternativeExerciseId
                );

                $stmt->execute();
            }

            return true;

        } catch (Exception $e) {
            error_log("Error in addExercisesToProgram: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate a unique slug from title
     */
    private function generateSlug($title)
    {
        $slug = strtolower(trim($title));
        $slug = preg_replace('/[^a-z0-9-]/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');

        // Ensure uniqueness
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if slug exists
     */
    private function slugExists($slug)
    {
        $query = "SELECT id FROM trainer_programs WHERE slug = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("s", $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    /**
     * Search programs
     */
    public function searchPrograms($searchTerm, $filters = [])
    {
        try {
            $query = "SELECT 
                        tp.id, tp.trainer_id, tp.title, tp.description,
                        tp.difficulty_level, tp.duration_weeks, tp.category,
                        tp.price, tp.currency, tp.purchase_count,
                        tp.rating_average, tp.rating_count,
                        u.full_name as trainer_name
                      FROM trainer_programs tp
                      JOIN user u ON tp.trainer_id = u.userid
                      WHERE tp.status = 'published' AND tp.is_deleted = 0
                      AND (tp.title LIKE ? OR tp.description LIKE ? OR tp.tags LIKE ?)";

            $searchParam = '%' . $searchTerm . '%';
            $params = [$searchParam, $searchParam, $searchParam];
            $types = 'sss';

            // Apply additional filters
            if (!empty($filters['category'])) {
                $query .= " AND tp.category = ?";
                $params[] = $filters['category'];
                $types .= 's';
            }

            $query .= " ORDER BY tp.purchase_count DESC, tp.rating_average DESC LIMIT 20";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();

            $programs = [];
            while ($row = $result->fetch_assoc()) {
                $programs[] = $row;
            }

            return $programs;

        } catch (Exception $e) {
            error_log("Error in searchPrograms: " . $e->getMessage());
            throw $e;
        }
    }
}
