<?php
// ============================================================
// users.php (admin)
// GET  -> lists all users (excluding password), optionally filtered by role.
// POST -> suspends or activates a user account.
// Passwords are NEVER included in any response.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $role_filter = $_GET['role'] ?? '';

    $query = "SELECT user_id, full_name, email, phone, role, status, created_at FROM users";
    if (in_array($role_filter, ['customer', 'host', 'admin'])) {
        $query .= " WHERE role = ?";
    }
    $query .= " ORDER BY created_at DESC";

    $stmt = mysqli_prepare($conn, $query);
    if (in_array($role_filter, ['customer', 'host', 'admin'])) {
        mysqli_stmt_bind_param($stmt, "s", $role_filter);
    }
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $users = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $users[] = $row; // password column was never selected, so it can't leak
    }
    mysqli_stmt_close($stmt);
    mysqli_close($conn);

    send_response("success", "Users loaded successfully.", ["users" => $users]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // -------------------- SUSPEND / ACTIVATE --------------------
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'] ?? '';
    $new_status = $data['status'] ?? '';

    if (!is_numeric($user_id)) {
        send_response("error", "A valid user ID is required.");
    }
    if (!in_array($new_status, ['active', 'suspended'])) {
        send_response("error", "Invalid status.");
    }

    // An admin should never be able to suspend their own account or another admin.
    $target_query = "SELECT role FROM users WHERE user_id = ?";
    $target_stmt = mysqli_prepare($conn, $target_query);
    mysqli_stmt_bind_param($target_stmt, "i", $user_id);
    mysqli_stmt_execute($target_stmt);
    $target_result = mysqli_stmt_get_result($target_stmt);
    $target = mysqli_fetch_assoc($target_result);
    mysqli_stmt_close($target_stmt);

    if (!$target) {
        send_response("error", "User not found.");
    }
    if ($target['role'] === 'admin') {
        send_response("error", "Admin accounts cannot be suspended from here.");
    }

    $update_query = "UPDATE users SET status = ? WHERE user_id = ?";
    $update_stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($update_stmt, "si", $new_status, $user_id);

    if (mysqli_stmt_execute($update_stmt)) {
        log_activity($conn, $_SESSION['user_id'], "Profile Updated");
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("success", "User status updated successfully.");
    } else {
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to update user status. Please try again.");
    }
}
?>
