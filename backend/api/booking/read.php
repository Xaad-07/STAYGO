<?php
// ============================================================
// read.php (booking)
// Returns bookings depending on who is asking:
//   - A customer sees their own bookings (My Bookings page).
//   - A host sees bookings made on their properties (Host Bookings page).
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_login();

$role = $_SESSION['role'];
$user_id = $_SESSION['user_id'];

if ($role === 'customer') {
    // Customer's own bookings, with property title/city/image for the list view.
    $query = "SELECT b.*, p.title AS property_title, p.city,
                     (SELECT image_path FROM property_images pi
                        WHERE pi.property_id = p.property_id
                        ORDER BY pi.is_primary DESC, pi.image_id ASC LIMIT 1) AS property_image
              FROM bookings b
              JOIN properties p ON b.property_id = p.property_id
              WHERE b.customer_id = ?
              ORDER BY b.created_at DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $user_id);

} elseif ($role === 'host') {
    // All bookings made on properties owned by this host.
    $query = "SELECT b.*, p.title AS property_title, u.full_name AS customer_name
              FROM bookings b
              JOIN properties p ON b.property_id = p.property_id
              JOIN users u ON b.customer_id = u.user_id
              WHERE p.host_id = ?
              ORDER BY b.created_at DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $user_id);

} else {
    send_response("error", "This action is not available for your role.");
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$bookings = [];
while ($row = mysqli_fetch_assoc($result)) {
    $bookings[] = $row;
}
mysqli_stmt_close($stmt);
mysqli_close($conn);

if (count($bookings) > 0) {
    send_response("success", "Bookings loaded successfully.", ["bookings" => $bookings]);
} else {
    send_response("success", "No bookings found.", ["bookings" => []]);
}
?>
