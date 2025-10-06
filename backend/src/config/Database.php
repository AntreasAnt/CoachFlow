<?php

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

class Database
{
    private $host = "localhost";
    private $dbName = "trainers-all-in-one";
    private $username = "root";
    private $password = "";
    private $conn;

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
                $this->conn = new \mysqli($this->host, $this->username, $this->password);

                // First check if we can connect to MySQL
                if ($this->conn->connect_error) {
                    throw new \Exception("Connection failed: " . $this->conn->connect_error);
                }

                // Try to select the database
                if (!$this->conn->select_db($this->dbName)) {
                    throw new \Exception("Database {$this->dbName} does not exist");
                }

                // Set charset
                $this->conn->set_charset("utf8mb4");
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
