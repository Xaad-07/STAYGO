<?php
// ============================================================
// db.php
// Creates a single MySQLi connection used by all API files.
// Procedural style as required by the project guidelines.
// ============================================================

// Allow the React (Vite) dev server to call this API during development.
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests sent by the browser before POST calls.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection settings (default WAMP values).
$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "staygo_db";

// Create the connection using procedural mysqli_connect().
$conn = mysqli_connect($db_host, $db_user, $db_pass, $db_name);

// Stop execution and return a clean JSON error if the connection fails.
if (!$conn) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed."
    ]);
    exit();
}

// Make sure data is read and written using UTF-8.
mysqli_set_charset($conn, "utf8mb4");
?>
