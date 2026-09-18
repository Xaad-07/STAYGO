<?php
// ============================================================
// change_password.php
// Lets a logged-in user change their password.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_login();

$data = json_decode(file_get_contents("php://input"), true);

$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

if (strlen($new_password) < 8 ||
    !preg_match('/[A-Z]/', $new_password) ||
    !preg_match('/[a-z]/', $new_password) ||
    !preg_match('/[0-9]/', $new_password)) {
    send_response("error", "New password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.");
}

if ($new_password !== $confirm_password) {
    send_response("error", "New passwords do not match.");
}

// Fetch the current hashed password to verify the current_password field.
$query = "SELECT password FROM users WHERE user_id = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $_SESSION['user_id']);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$user || !password_verify($current_password, $user['password'])) {
    send_response("error", "Current password is incorrect.");
}

$hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

$update_query = "UPDATE users SET password = ? WHERE user_id = ?";
$update_stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($update_stmt, "si", $hashed_password, $_SESSION['user_id']);

if (mysqli_stmt_execute($update_stmt)) {
    log_activity($conn, $_SESSION['user_id'], "Profile Updated");
    mysqli_stmt_close($update_stmt);
    mysqli_close($conn);
    send_response("success", "Password changed successfully.");
} else {
    mysqli_stmt_close($update_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to change password. Please try again.");
}
?>
