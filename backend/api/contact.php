<?php
// ============================================================
// contact.php
// Public endpoint for the Contact page form. No login required.
// Stores the message so an admin can review it later.
// ============================================================

require_once __DIR__ . '/../config/db.php';
session_start();
require_once __DIR__ . '/../utils/helpers.php';

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$message = trim($data['message'] ?? '');

if (strlen($name) < 2) {
    send_response("error", "Please enter your name.");
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_response("error", "Please enter a valid email address.");
}
if (strlen($message) < 10) {
    send_response("error", "Please enter a message of at least 10 characters.");
}

$insert_query = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";
$insert_stmt = mysqli_prepare($conn, $insert_query);
mysqli_stmt_bind_param($insert_stmt, "sss", $name, $email, $message);

if (mysqli_stmt_execute($insert_stmt)) {
    mysqli_stmt_close($insert_stmt);
    mysqli_close($conn);
    send_response("success", "Your message has been sent. We'll get back to you soon.");
} else {
    mysqli_stmt_close($insert_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to send your message. Please try again.");
}
?>
