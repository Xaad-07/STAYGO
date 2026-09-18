<?php
// ============================================================
// profile.php
// GET  -> returns the logged-in user's profile info.
// POST -> updates full_name and phone (email is fixed as the
//         login identity and is not editable here).
// ============================================================

require_once __DIR__ . '/../config/db.php';
session_start();
require_once __DIR__ . '/../utils/helpers.php';

require_login();

$user_id = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // -------------------- FETCH PROFILE --------------------
    $query = "SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $user_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $user = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    mysqli_close($conn);

    if ($user) {
        send_response("success", "Profile loaded successfully.", ["user" => $user]);
    } else {
        send_response("error", "User not found.");
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // -------------------- UPDATE PROFILE --------------------
    $data = json_decode(file_get_contents("php://input"), true);
    $full_name = trim($data['full_name'] ?? '');
    $phone = trim($data['phone'] ?? '');

    if (strlen($full_name) < 3) {
        send_response("error", "Full name must be at least 3 characters long.");
    }
    if (!preg_match('/^[0-9]{10}$/', $phone)) {
        send_response("error", "Phone number must be exactly 10 digits.");
    }

    $update_query = "UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?";
    $update_stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($update_stmt, "ssi", $full_name, $phone, $user_id);

    if (mysqli_stmt_execute($update_stmt)) {
        // Keep the session's full_name in sync so the navbar/dashboard
        // reflect the change immediately without needing a fresh login.
        $_SESSION['full_name'] = $full_name;

        log_activity($conn, $user_id, "Profile Updated");
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("success", "Profile updated successfully.", [
            "user" => ["full_name" => $full_name, "phone" => $phone]
        ]);
    } else {
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to update profile. Please try again.");
    }
}
?>
