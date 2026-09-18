<?php
// ============================================================
// logout.php
// Destroys the current PHP session.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

if (isset($_SESSION['user_id'])) {
    log_activity($conn, $_SESSION['user_id'], "Logout");
}

// Clear all session variables and destroy the session.
$_SESSION = [];
session_destroy();

mysqli_close($conn);
send_response("success", "Logged out successfully.");
?>
