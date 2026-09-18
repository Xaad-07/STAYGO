<?php
// ============================================================
// details.php (booking)
// Returns full details for a single booking. Only the customer who
// made the booking, or the host who owns the property, may view it.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_login();

$booking_id = $_GET['booking_id'] ?? '';

if (!is_numeric($booking_id)) {
    send_response("error", "A valid booking ID is required.");
}

$query = "SELECT b.*, p.title AS property_title, p.address, p.city, p.state, p.host_id,
                 u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
                 h.full_name AS host_name, h.phone AS host_phone
          FROM bookings b
          JOIN properties p ON b.property_id = p.property_id
          JOIN users u ON b.customer_id = u.user_id
          JOIN users h ON p.host_id = h.user_id
          WHERE b.booking_id = ?";

$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $booking_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$booking = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$booking) {
    send_response("error", "Booking not found.");
}

// Only the customer who booked it, or the host who owns the property, can view it.
$user_id = $_SESSION['user_id'];
$is_owner_customer = ($_SESSION['role'] === 'customer' && (int) $booking['customer_id'] === (int) $user_id);
$is_owner_host = ($_SESSION['role'] === 'host' && (int) $booking['host_id'] === (int) $user_id);
$is_admin = ($_SESSION['role'] === 'admin');

if (!$is_owner_customer && !$is_owner_host && !$is_admin) {
    http_response_code(403);
    send_response("error", "You are not authorized to view this booking.");
}

mysqli_close($conn);
send_response("success", "Booking details loaded successfully.", ["booking" => $booking]);
?>
