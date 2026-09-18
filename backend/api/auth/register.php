<?php
// ============================================================
// register.php
// Creates a new customer or host account.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

// Read the JSON body sent by React/Axios.
$data = json_decode(file_get_contents("php://input"), true);

$full_name = trim($data['full_name'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';
$role = $data['role'] ?? '';

// -------------------- VALIDATION --------------------

if ($full_name === '' || strlen($full_name) < 3) {
    send_response("error", "Full name must be at least 3 characters long.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response("error", "Please enter a valid email address.");
}

if (!preg_match('/^[0-9]{10}$/', $phone)) {
    send_response("error", "Phone number must be exactly 10 digits.");
}

// Only customer and host can be self-registered. Admin accounts are never created here.
if ($role !== 'customer' && $role !== 'host') {
    send_response("error", "Invalid role selected.");
}

if (strlen($password) < 8 ||
    !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[a-z]/', $password) ||
    !preg_match('/[0-9]/', $password)) {
    send_response("error", "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.");
}

if ($password !== $confirm_password) {
    send_response("error", "Passwords do not match.");
}

// -------------------- DUPLICATE EMAIL CHECK --------------------

// Check whether the email is already registered using a prepared statement.
$check_query = "SELECT user_id FROM users WHERE email = ?";
$check_stmt = mysqli_prepare($conn, $check_query);
mysqli_stmt_bind_param($check_stmt, "s", $email);
mysqli_stmt_execute($check_stmt);
$check_result = mysqli_stmt_get_result($check_stmt);

if (mysqli_num_rows($check_result) > 0) {
    mysqli_stmt_close($check_stmt);
    send_response("error", "Email is already registered.");
}
mysqli_stmt_close($check_stmt);

// -------------------- INSERT NEW USER --------------------

// Hash the password before saving it. Plain passwords are never stored.
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

$insert_query = "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)";
$insert_stmt = mysqli_prepare($conn, $insert_query);
mysqli_stmt_bind_param($insert_stmt, "sssss", $full_name, $email, $phone, $hashed_password, $role);

if (mysqli_stmt_execute($insert_stmt)) {
    $new_user_id = mysqli_insert_id($conn);
    log_activity($conn, $new_user_id, "Registration");
    mysqli_stmt_close($insert_stmt);
    mysqli_close($conn);
    send_response("success", "Account created successfully. You can now log in.");
} else {
    mysqli_stmt_close($insert_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to create account. Please try again.");
}
?>
