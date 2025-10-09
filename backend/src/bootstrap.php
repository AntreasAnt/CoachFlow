<?php

/**
 * Bootstrap file for loading environment variables
 * Include this file at the beginning of your application
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables from .env file
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

define('APP_RUNNING', true);
