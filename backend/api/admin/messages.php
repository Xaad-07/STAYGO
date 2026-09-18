<?php
// ============================================================
// messages.php (admin)
// GET  -> lists all contact form submissions.
// POST -> marks a message as read.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT message_id, name, email, message, status, created_at
              FROM contact_messages ORDER BY created_at DESC";
    $result = mysqli_query($conn, $query);

    $messages = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $messages[] = $row;
    }
    mysqli_close($conn);
    send_response("success", "Messages loaded successfully.", ["messages" => $messages]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $message_id = $data['message_id'] ?? '';

    if (!is_numeric($message_id)) {
        send_response("error", "A valid message ID is required.");
    }

    $update_query = "UPDATE contact_messages SET status = 'read' WHERE message_id = ?";
    $update_stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($update_stmt, "i", $message_id);

    if (mysqli_stmt_execute($update_stmt)) {
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("success", "Message marked as read.");
    } else {
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to update message. Please try again.");
    }
}
?>
