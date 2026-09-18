<?php
// ============================================================
// forgot_password.php
// Resets a password after verifying email + phone match an account.
// This is a simple project-friendly flow with no OTP/email service.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$new_password = $data['new_password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response("error", "Please enter a valid email address.");
}

if (!preg_match('/^[0-9]{10}$/', $phone)) {
    send_response("error", "Phone number must be exactly 10 digits.");
}

if (strlen($new_password) < 8 ||
    !preg_match('/[A-Z]/', $new_password) ||
    !preg_match('/[a-z]/', $new_password) ||
    !preg_match('/[0-9]/', $new_password)) {
    send_response("error", "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.");
}

if ($new_password !== $confirm_password) {
    send_response("error", "Passwords do not match.");
}

// Confirm that the email AND phone belong to the same account.
$query = "SELECT user_id FROM users WHERE email = ? AND phone = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "ss", $email, $phone);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$user) {
    send_response("error", "No account matches that email and phone number.");
}

$hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

$update_query = "UPDATE users SET password = ? WHERE user_id = ?";
$update_stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($update_stmt, "si", $hashed_password, $user['user_id']);

if (mysqli_stmt_execute($update_stmt)) {
    log_activity($conn, $user['user_id'], "Profile Updated");
    mysqli_stmt_close($update_stmt);
    mysqli_close($conn);
    send_response("success", "Password changed successfully.");
} else {
    mysqli_stmt_close($update_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to reset password. Please try again.");
}
?>
