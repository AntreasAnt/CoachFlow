<?php

// Prevent direct access to this file
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    http_response_code(403);
    die('Direct access to this file is not allowed.');
}

/**
 * Database Connection Class
 * 
 * This class manages the connection to the MySQL database using MySQLi.
 * It provides methods to establish and close the database connection.
 * 
 * Usage:
 * - Call `connect()` to establish a database connection.
 * - Call `close()` to properly close the connection.
 * 
 * Ensure the database credentials are correctly set before deployment.
 */
if (!defined(constant_name: 'APP_RUNNING')) exit('No direct script access');

class Database
{
    private $host;
    private $dbName;
    private $username;
    private $password;
    private $charset;
    private $port;
    private $socket;
    private $conn;

    public function __construct() {
        // Load database configuration from environment variables with fallbacks
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->dbName = $_ENV['DB_NAME'] ?? 'trainers-all-in-one';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
        $this->charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';
        $this->port = $_ENV['DB_PORT'] ?? 3306;
        $this->socket = $_ENV['DB_SOCKET'] ?? '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock';
    }

    /**
     * Establishes a database connection.
     * 
     * - If a connection does not exist, it creates a new MySQLi connection.
     * - If the connection fails, it terminates the script with an error message.
     * - Returns the active database connection.
     */

    public function connect()
    {
        if ($this->conn === null) {
            // Enable error reporting
            mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

            try {
                $this->conn = new \mysqli($this->host, $this->username, $this->password, '', $this->port, $this->socket);

                // First check if we can connect to MySQL
                if ($this->conn->connect_error) {
                    throw new \Exception("Connection failed: " . $this->conn->connect_error);
                }

                // Try to select the database
                if (!$this->conn->select_db($this->dbName)) {
                    throw new \Exception("Database {$this->dbName} does not exist");
                }

                // Set charset
                $this->conn->set_charset($this->charset);
            } catch (\Exception $e) {
                die("Database Error: " . $e->getMessage());
            }
        }
        return $this->conn;
    }

    /**
     * Closes the database connection.
     * 
     * - Ensures that the connection is properly closed when no longer needed.
     */


    public function close()
    {
        if ($this->conn !== null) {
            $this->conn->close();
            $this->conn = null; // Reset the connection variable
        }
    }
}
