<?php
// ============================================================
// dashboard.php (admin)
// Returns platform-wide summary counts plus recent users and
// recent bookings, and recent activity for the Admin Dashboard.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

// -------------------- TOTAL COUNTS --------------------

$total_users_row = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'customer'"));
$total_hosts_row = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'host'"));
$total_properties_row = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS total FROM properties"));
$total_bookings_row = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS total FROM bookings"));

// -------------------- RECENT USERS (last 5, any role) --------------------

$recent_users_result = mysqli_query(
    $conn,
    "SELECT user_id, full_name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5"
);
$recent_users = [];
while ($row = mysqli_fetch_assoc($recent_users_result)) {
    $recent_users[] = $row;
}

// -------------------- RECENT BOOKINGS (last 5) --------------------

$recent_bookings_result = mysqli_query(
    $conn,
    "SELECT b.booking_id, b.booking_number, b.status, b.total_amount, b.created_at,
            p.title AS property_title, u.full_name AS customer_name
     FROM bookings b
     JOIN properties p ON b.property_id = p.property_id
     JOIN users u ON b.customer_id = u.user_id
     ORDER BY b.created_at DESC LIMIT 5"
);
$recent_bookings = [];
while ($row = mysqli_fetch_assoc($recent_bookings_result)) {
    $recent_bookings[] = $row;
}

// -------------------- RECENT ACTIVITY (last 8) --------------------

$recent_activity_result = mysqli_query(
    $conn,
    "SELECT a.log_id, a.action, a.ip_address, a.created_at, u.full_name AS user_name
     FROM activity_logs a
     LEFT JOIN users u ON a.user_id = u.user_id
     ORDER BY a.created_at DESC LIMIT 8"
);
$recent_activity = [];
while ($row = mysqli_fetch_assoc($recent_activity_result)) {
    $recent_activity[] = $row;
}

mysqli_close($conn);

send_response("success", "Dashboard loaded successfully.", [
    "total_users" => (int) $total_users_row['total'],
    "total_hosts" => (int) $total_hosts_row['total'],
    "total_properties" => (int) $total_properties_row['total'],
    "total_bookings" => (int) $total_bookings_row['total'],
    "recent_users" => $recent_users,
    "recent_bookings" => $recent_bookings,
    "recent_activity" => $recent_activity,
]);
?>
