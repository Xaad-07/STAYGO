<?php
// ============================================================
// login.php
// Verifies credentials and starts a PHP session for the user.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if ($email === '' || $password === '') {
    send_response("error", "Please enter both email and password.");
}

// Look up the user by email using a prepared statement.
$query = "SELECT user_id, full_name, email, password, role, status FROM users WHERE email = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

// Use one generic message for both "no such email" and "wrong password"
// so we never reveal which part of the login was incorrect.
if (!$user || !password_verify($password, $user['password'])) {
    send_response("error", "Invalid email or password.");
}

if ($user['status'] === 'suspended') {
    send_response("error", "Your account has been suspended. Please contact support.");
}

// Store the essential user info in the session.
$_SESSION['user_id'] = $user['user_id'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];

log_activity($conn, $user['user_id'], "Login");
mysqli_close($conn);

send_response("success", "Login successful.", [
    "user" => [
        "user_id" => $user['user_id'],
        "full_name" => $user['full_name'],
        "email" => $user['email'],
        "role" => $user['role']
    ]
]);
?>
