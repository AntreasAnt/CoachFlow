<?php
// This file contains the UserController class which handles the validation of user input and creation of new users. 
// It includes validation for various fields such as username, email, password, phone, country code, and birthday.
// Additionally, it creates a new user and sends a confirmation email.

if (!defined('APP_RUNNING')) exit('No direct script access');

include_once("../models/UserModel.php"); // Include the UserModel class for database interaction
require(__DIR__ . '/NotificationController.php'); // Include the NotificationController to handle email notifications

class UserController extends UserModel
{
    private $uploadDir = '../../uploads/profile_pictures/';


    // Method to validate user input data before user creation
    public function validateInfo($inputData)
    {
        $errors = []; // Initialize an empty array to store validation errors

        // Sanitize and validate the username field
        try {

            if (isset($inputData['username'])) {

                // Validate that the username contains only letters, numbers, and underscores
                if (!preg_match('/^[a-zA-Z0-9_]+$/', $inputData['username'])) {
                    $errors['username'] = "Username can only contain letters, numbers and underscores";
                }

                // Sanitize the username to remove any unwanted characters
                $username = htmlspecialchars(
                    preg_replace(
                        '/[^a-zA-Z0-9_]/',
                        '',
                        trim($inputData['username'])
                    ),
                    ENT_QUOTES | ENT_HTML5,
                    'UTF-8'
                );

                // Check if the username is not empty and its length is within valid range
                if (!$username) {
                    $errors['username'] = "Username is required";
                } elseif (strlen($username) < 3 || strlen($username) > 50) {
                    $errors['username'] = "Username must be between 3 and 50 characters";
                } elseif ($this->isUsernameExists($username)) {
                    $errors['username'] = "Username already exists";
                } else {
                    $inputData['username'] = $username; // Assign valid username to input data
                }
            }

            // Sanitize and validate the email address
            if (isset($inputData['email'])) {
                if (!filter_var($inputData['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors['email'] = "Invalid email format"; // Invalid email format
                }

                // Sanitize the email address to remove unwanted characters
                $email = filter_var(
                    strip_tags(trim($inputData['email'])),
                    FILTER_SANITIZE_EMAIL
                );

                // Check if the email is not empty and doesn't already exist
                if (!$email) {
                    $errors['email'] = "Email is required";
                } elseif ($this->isEmailExists($inputData["email"])) {
                    $errors['email'] = "Email already exists"; // Email already in use
                } elseif (strlen($email) < 3 || strlen($email) > 50) {

                    $errors['email'] = "Email must be between 3 and 50 characters"; // Email length validation
                } else {
                    $inputData['email'] = $email; // Assign valid email to input data
                }
            }

            // Sanitize and validate the password
            if (isset($inputData['password'])) {
                // Trim password but don't sanitize since it will be hashed
                $password = trim($inputData["password"]);

                // Password validation rules
                $minLength = strlen($password) >= 8;
                $maxLength = strlen($password) >= 800;
                $hasUpperCase = preg_match('/[A-Z]/', $password);
                $hasLowerCase = preg_match('/[a-z]/', $password);
                $hasNumbers = preg_match('/\d/', $password);
                $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

                // Check all password requirements
                if (!$minLength) {
                    $errors['password'] = "Password must be at least 8 characters";
                } elseif ($maxLength) {
                    $errors['password'] = "Password must be fewer characters";
                } elseif (!$hasUpperCase) {
                    $errors['password'] = "Password must contain at least one uppercase letter";
                } elseif (!$hasLowerCase) {
                    $errors['password'] = "Password must contain at least one lowercase letter";
                } elseif (!$hasNumbers) {
                    $errors['password'] = "Password must contain at least one number";
                } elseif (!$hasSpecialChars) {
                    $errors['password'] = "Password must contain at least one special character";
                } else {
                    $inputData["password"] = $password; // Assign valid password to input data
                }
            }


            return $errors; // Return all validation errors
        } catch (Exception $e) {
            return ["error" => "An error occurred while validating the information"]; // Return error message if validation fails
        }
    }

    // Method to create a new user after validating input
    public function createUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }

            // Assign validated data to the user model
            $this->username = $inputData["username"];
            $this->email = $inputData["email"];
            $this->password = password_hash($inputData["password"], PASSWORD_DEFAULT);
            $this->UserID = $this->getUserID(); // Generate user ID
            $this->registrationDate = time();
            // Set user role / privileges. Accept textual roles (trainer/trainee) or numeric role codes (1=admin,2=manager,3=user)
            if (isset($inputData['role'])) {
                $role = $inputData['role'];
                // Normalize numeric roles directly, otherwise keep textual trainer/trainee
                if (in_array($role, ['1','2','3',1,2,3], true)) {
                    $this->UserPrivileges = (string)$role; // store numeric code as string
                } elseif (in_array($role, ['trainer','trainee'], true)) {
                    $this->UserPrivileges = $role;
                } else {
                    $this->UserPrivileges = 'trainee';
                }
            } else {
                $this->UserPrivileges = 'trainee'; // default
            }
            // Set isverified from input or default to 0
            $this->IsVerified = isset($inputData['isverified']) ? (int)$inputData['isverified'] : 0;

            $user = $this->saveUser(); // Save the new user to the database

            $this->updateLastLogin($this->UserID);
            // Send Confirmation email
            $notificationController = new NotificationController();
            $emailResult = $notificationController->SignUpVerificationRequest(
                $this->email,
                $this->username,

            );



            $response = [
                "success" => true,
                "message" => "User created successfully",
                "UserID" => $this->UserID
            ];
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }
    public function login($inputData)
    {

        $errors = [];

        try {
            // Sanitize and validate the email address
            if (isset($inputData['email'])) {
                if (!filter_var($inputData['email'], FILTER_VALIDATE_EMAIL)) {
                    $errors['email'] = "Invalid email format"; // Invalid email format
                }

                // Sanitize the email address to remove unwanted characters
                $email = filter_var(
                    strip_tags(trim($inputData['email'])),
                    FILTER_SANITIZE_EMAIL
                );

                // Check if the email is not empty and doesn't already exist
                if (!$email) {
                    $errors['email'] = "Email is required";
                } elseif (strlen($email) < 3 || strlen($email) > 50) {

                    $errors['email'] = "Email must be between 3 and 50 characters"; // Email length validation
                } else {
                    $inputData['email'] = $email; // Assign valid email to input data
                }
            }

            // Sanitize and validate the password
            if (isset($inputData['password'])) {
                // Trim password but don't sanitize since it will be hashed
                $password = trim($inputData["password"]);

                // Password validation rules
                $minLength = strlen($password) >= 8;
                $maxLength = strlen($password) >= 800;
                $hasUpperCase = preg_match('/[A-Z]/', $password);
                $hasLowerCase = preg_match('/[a-z]/', $password);
                $hasNumbers = preg_match('/\d/', $password);
                $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

                // Check all password requirements
                if (!$minLength) {
                    $errors['password'] = "Password must be at least 8 characters";
                } elseif ($maxLength) {
                    $errors['password'] = "Password must be fewer characters";
                } elseif (!$hasUpperCase) {
                    $errors['password'] = "Password must contain at least one uppercase letter";
                } elseif (!$hasLowerCase) {
                    $errors['password'] = "Password must contain at least one lowercase letter";
                } elseif (!$hasNumbers) {
                    $errors['password'] = "Password must contain at least one number";
                } elseif (!$hasSpecialChars) {
                    $errors['password'] = "Password must contain at least one special character";
                } else {
                    $inputData["password"] = $password; // Assign valid password to input data
                }
            }

            if (!empty($errors)) {
                return $errors;
            }

            // Assign validated data to the user model
            $this->email = $inputData["email"];
            $this->password = $inputData["password"];


            $user = $this->checkIfUserExists($this->email, $this->password); // Check id user exist

            if ($user !== false) {
                $this->updateLastLogin($user['userid']);
                $this->defineSession($user);

                $response = [
                    "success" => true,
                    "message" => "Login successful",
                    "user" => [
                        "id" => $user['userid'],
                        "privileges" => $user['userprivileges'],
                        "username" => $user['username']
                    ]
                ];
            } else {
                $response = [
                    "success" => false,
                    "message" => "Login credentials do not match",
                ];
            }
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }



        return $response; // Return the response to the user
    }

    public function defineSession($user)
    {

        // Store user data in session
        $_SESSION['user_id'] = $user['userid'];
        $_SESSION['user_privileges'] = $user['userprivileges'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['logged_in'] = true;
    }
    public function logout()
    {
        try {


            $response = [];
            // Clears PHP session data on server
            $_SESSION = array();

            //  Destroy the session cookie
            if (isset($_COOKIE[session_name()])) {
                setcookie(session_name(), '', time() - 3600, '/');
            }

            // Destroy the session
            session_destroy();

            $response = [
                'success' => true,
                'message' => 'Logout successful'
            ];
        } catch (Exception $e) {
            $response = [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }

        return $response;
    }
    public function changePassword($newPassword)
    {
        try {
            // Check if user is authenticated via session
            if (!isset($_SESSION['user_id'])) {
                return [
                    'success' => false,
                    'message' => 'User not authenticated'
                ];
            }

            // Clean and validate the new password
            $password = trim($newPassword);
            // Password strength validation
            $minLength = strlen($password) >= 8;
            $hasUpperCase = preg_match('/[A-Z]/', $password);
            $hasLowerCase = preg_match('/[a-z]/', $password);
            $hasNumbers = preg_match('/\d/', $password);
            $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

            // Check if password meets all security requirements
            if (!$minLength || !$hasUpperCase || !$hasLowerCase || !$hasNumbers || !$hasSpecialChars) {
                return [
                    'success' => false,
                    'message' => 'Password does not meet requirements'
                ];
            }

            // Update password in database
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            if ($this->updatePassword($_SESSION['user_id'], $hashedPassword)) {
                return [
                    'success' => true,
                    'message' => 'Password updated successfully'
                ];
            }
            // Return error if update fails
            return [
                'success' => false,
                'message' => 'Failed to update password'
            ];
        } catch (Exception $e) {
            error_log("Password change error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while changing password'
            ];
        }
    }


    public function ResetPassword($inputData)
    {
        $email = $inputData['email'];
        $newPassword = $inputData['password'];

        try {
            // Clean and validate the new password
            $password = trim($newPassword);
            // Password strength validation
            $minLength = strlen($password) >= 8;
            $hasUpperCase = preg_match('/[A-Z]/', $password);
            $hasLowerCase = preg_match('/[a-z]/', $password);
            $hasNumbers = preg_match('/\d/', $password);
            $hasSpecialChars = preg_match('/[^A-Za-z0-9]/', $password);

            // Check if password meets all security requirements
            if (!$minLength || !$hasUpperCase || !$hasLowerCase || !$hasNumbers || !$hasSpecialChars) {
                return [
                    'success' => false,
                    'message' => 'Password does not meet requirements',
                    'password' => $password
                ];
            }

            // Update password in database
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            if ($this->updatePasswordResetPass($email, $hashedPassword)) {
                return [
                    'success' => true,
                    'message' => 'Password updated successfully'
                ];
            }
            // Return error if update fails
            return [
                'success' => false,
                'message' => 'Failed to update password'
            ];
        } catch (Exception $e) {
            error_log("Password change error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while changing password'
            ];
        }
    }

    public function addUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }

            // Assign validated data to the user model
            $this->username = $inputData["username"];
            $this->email = $inputData["email"];
            $this->password = password_hash($inputData["password"], PASSWORD_DEFAULT);


            $this->UserID = $this->getUserID(); // Generate user ID
            $this->registrationDate = $inputData["registrationDate"]; // Set registration date

            $this->UserPrivileges = $inputData["role"] ?? 'trainee'; // Get role from input or default to trainee
            $this->ImageID = null; // Default image ID is null
            $this->IsVerified = 1; // Set user as verified

            error_log("User data: " . print_r($this, true));
            $user = $this->saveUser(); // Save the new user to the database


            $response = [
                "success" => true,
                "message" => "User created successfully",
                "UserID" => $this->UserID
            ];
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }

    public function DeleteUsers($userIds)
    {

        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;
            // Check if currently logged-in user is being deleted
            //isset($_SESSION['user_id']) - Checks if there's a logged-in user 
            //in_array($_SESSION['user_id'], $ids) - Checks if the logged-in user's ID is in the array of users to be deleted
            if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                // Log out the user 
                $this->logout();
            }
            // Update IsDeleted status for all selected users
            $success = $this->updateIsDeletedStatus($ids);

            if ($success) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' user(s) deleted successfully'
                ];
            }

            throw new Exception("Failed to delete users");
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }



    public function ForceResetusers($userIds)
    {
        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;

            // Check if currently logged-in user is among those to be reset and log them out
            if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                $this->logout();
            }

            $notificationModel = new NotificationController();
            $failedResets = []; // Store failures here

            foreach ($ids as $id) {
                $user = $this->getUserById($id);
                $email = $user['email'];
                if (!$email) {
                    $failedResets[] = "User ID: $id (missing email)";
                    continue;
                }
                // Try to send password reset email
                $success = $notificationModel->ResetPasswordRequest($email);
                if (!$success) {
                    $failedResets[] = "Email: $email";
                }
            }

            if (count($failedResets) === 0) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' user(s) reset successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to reset passwords for: ' . implode(', ', $failedResets)
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ];
        }
    }


    public function editUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            //if error is on email we need to check if the email belongs to the same user and then remove the error
            if (isset($validationErrors['email'])) {
                $user = $this->getUserById($inputData['userId']);
                if ($user['email'] == $inputData['email']) {
                    // The email is the same as the current one, so we can remove the error
                    unset($validationErrors['email']);
                }
            }
            //if error is on username we need to check if the username belongs to the same user and then remove the error
            if (isset($validationErrors['username'])) {
                $user = $this->getUserById($inputData['userId']);
                if ($user['username'] == $inputData['username']) {
                    // The username is the same as the current one, so we can remove the error
                    unset($validationErrors['username']);
                }
            }

            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }

            $result = $this->saveEditUser([
                'username' => $inputData['username'],
                'email' => $inputData['email'],
                'role' => $inputData['role'],
                'userId' => $inputData['userId'],

            ]);

            if ($result) // Save the new user to the database
            {
                $response = [
                    "success" => true,
                    "message" => "User created successfully",
                    "UserID" => $this->UserID
                ];
            } else {
                $response = [
                    "success" => false,
                    "message" => "Failed to edit user"
                ];
            }
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }
    public function editoneUser($inputData)
    {
        $response = []; // Initialize response array


        try {
            // Validate the user input
            $validationErrors = $this->validateInfo($inputData);
            //if error is on username we need to check if the username belongs to the same user and then remove the error
            if (isset($validationErrors['username'])) {
                $user = $this->getUserById($inputData['userId']);
                if ($user['username'] == $inputData['username']) {
                    // The username is the same as the current one, so we can remove the error
                    unset($validationErrors['username']);
                }
            }


            if (count($validationErrors) > 0) {
                error_log("Validation errors: " . print_r($validationErrors, true));
                return $validationErrors; // Return validation errors if any
            }





            $result = $this->saveOneUser([
                'username' => $inputData['username'],
                'userId' => $inputData['userId'],

            ]);

            if ($result) // Save the new user to the database
            {
                $response = [
                    "success" => true,
                    "message" => "User created successfully",
                    "UserID" => $this->UserID
                ];
            } else {
                $response = [
                    "success" => false,
                    "message" => "Failed to edit user"
                ];
            }
        } catch (Exception $e) {
            // Handle any errors that occur during user creation
            $response = [
                "success" => false,
                "message" => $e->getMessage()
            ];
        }

        return $response; // Return the response to the user
    }
    public function handleProfilePictureUpload($userId, $file)
    {
        try {
            // Create directory if it doesn't exist
            if (!file_exists($this->uploadDir)) {
                mkdir($this->uploadDir, 0777, true);
            }

            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!in_array($file['type'], $allowedTypes)) {
                return [
                    'success' => false,
                    'message' => 'Please upload JPG or PNG files only'
                ];
            }

            $fileName = time() . '_' . basename($file['name']);
            $targetPath = $this->uploadDir . $fileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                // Create web-accessible URL path
                $imageUrl = '/uploads/profile_pictures/' . $fileName;
                $fullImageUrl = $GLOBALS['BACKEND_ROUTES_API'] . $imageUrl;

                // Insert into Gallery table
                $imageId = $this->insertImage($fileName, $imageUrl);

                if ($imageId) {
                    if ($this->updateUserProfileImage($userId, $imageId)) {
                        return [
                            'success' => true,
                            'message' => 'Profile picture updated successfully',
                            'imageUrl' => $fullImageUrl // Return the full URL
                        ];
                    }
                }

                return ['success' => false, 'message' => 'Failed to update database'];
            }
            return ['success' => false, 'message' => 'Failed to upload file'];
        } catch (Exception $e) {
            error_log("Profile picture upload error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while uploading profile picture'
            ];
        }
    }
    public function UserDisable($userIds)
    {
        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;

            // Check if currently logged-in user is among those to be reset and log them out
            if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                $this->logout();
            }


            $failedDisable = []; // save fails here
            $successDisable = []; //save success here

            foreach ($ids as $id) {

                $success = $this->disableUser($id);
                if (!$success) {
                    $failedDisable[] = "Id: $id";
                } else {
                    $successDisable[] = $id;
                }
            }

            if (count($failedDisable) === 0) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' user(s) disabled successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'successDisable' =>  implode(', ', $successDisable),
                    'message' => 'Failed to disable users: ' . implode(', ', $failedDisable)
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ];
        }
    }
    public function UserEnable($userIds)
    {
        try {
            // Convert single ID to array if necessary
            $ids = (array) $userIds;

            // Check if currently logged-in user is among those to be reset and log them out
            if (isset($_SESSION['user_id']) && in_array($_SESSION['user_id'], $ids)) {
                $this->logout();
            }


            $failedEnable = []; // Store failures here
            $successEnable = []; //save success here

            foreach ($ids as $id) {

                $success = $this->enableUser($id);
                if (!$success) {
                    $failedEnable[] = "Id: $id";
                } else {
                    $successEnable[] = $id;
                }
            }

            if (count($failedEnable) === 0) {
                return [
                    'success' => true,
                    'message' => count($ids) . ' user(s) enabled successfully'
                ];
            } else {
                return [
                    'success' => false,
                    'successEnable' =>  implode(', ', $successEnable),
                    'message' => 'Failed to enable users: ' . implode(', ', $failedEnable)
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Search users by username or email
     * 
     * @param int $currentUserId - The ID of the current user (to exclude from results)
     * @param string $searchQuery - The search term
     * @param int $limit - Maximum number of results
     * @return array - Array of matching users
     */
    public function searchChatUsers($currentUserId, $searchQuery = '', $limit = 10)
    {
        try {
            // Validate limit
            if ($limit < 1 || $limit > 50) {
                $limit = 10;
            }

            // Search users by username or email (case-insensitive, partial match)
            $users = $this->searchUsers($currentUserId, $searchQuery, $limit);
            
            return [
                'success' => true,
                'users' => $users
            ];
        } catch (Exception $e) {
            error_log('UserController::searchChatUsers Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while searching users'
            ];
        }
    }
}
