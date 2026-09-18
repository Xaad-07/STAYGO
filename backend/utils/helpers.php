<?php
// ============================================================
// helpers.php
// Small reusable functions shared across API files.
// Must be included AFTER db.php and after session_start().
// ============================================================

// Sends a JSON response in the standard { status, message } format and stops the script.
function send_response($status, $message, $extra = []) {
    $response = array_merge(["status" => $status, "message" => $message], $extra);
    echo json_encode($response);
    exit();
}

// Records an action into the activity_logs table.
function log_activity($conn, $user_id, $action) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $query = "INSERT INTO activity_logs (user_id, action, ip_address) VALUES (?, ?, ?)";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "iss", $user_id, $action, $ip);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);
}

// Stops the script with an error response if no user is logged in.
function require_login() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        send_response("error", "Your session has expired. Please log in again.");
    }
}

// Stops the script with an error response if the logged-in user's role
// does not match the role required for this API.
function require_role($required_role) {
    require_login();
    if ($_SESSION['role'] !== $required_role) {
        http_response_code(403);
        send_response("error", "You are not authorized to perform this action.");
    }
}
?>
