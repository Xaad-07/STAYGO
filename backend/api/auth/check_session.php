<?php
// ============================================================
// check_session.php
// Called by React on app load to check if the user is still logged in.
// This lets the frontend restore login state after a page refresh
// without using LocalStorage for authentication.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

if (isset($_SESSION['user_id'])) {
    send_response("success", "Session active.", [
        "user" => [
            "user_id" => $_SESSION['user_id'],
            "full_name" => $_SESSION['full_name'],
            "email" => $_SESSION['email'],
            "role" => $_SESSION['role']
        ]
    ]);
} else {
    send_response("error", "No active session.");
}
?>
