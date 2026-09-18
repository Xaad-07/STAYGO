<?php
// ============================================================
// bookings.php (admin)
// Lists every booking on the platform for the Admin > Bookings page.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

$query = "SELECT b.booking_id, b.booking_number, b.check_in, b.check_out, b.total_amount, b.status,
                 p.title AS property_title, u.full_name AS customer_name
          FROM bookings b
          JOIN properties p ON b.property_id = p.property_id
          JOIN users u ON b.customer_id = u.user_id
          ORDER BY b.created_at DESC";

$result = mysqli_query($conn, $query);

$bookings = [];
while ($row = mysqli_fetch_assoc($result)) {
    $bookings[] = $row;
}

mysqli_close($conn);
send_response("success", "Bookings loaded successfully.", ["bookings" => $bookings]);
?>
