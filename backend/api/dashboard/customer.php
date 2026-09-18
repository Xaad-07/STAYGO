<?php
// ============================================================
// customer.php (dashboard)
// Returns the summary data shown on the Customer Dashboard:
// upcoming booking, most recent booking, wishlist count, and
// completed stay count. All values are computed live from the
// database -- nothing here is hardcoded.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('customer');

$customer_id = $_SESSION['user_id'];

// -------------------- UPCOMING BOOKING --------------------
// The soonest confirmed booking whose check-in date hasn't passed yet.
$upcoming_query = "SELECT b.booking_id, b.booking_number, b.check_in, b.check_out, p.title AS property_title
                    FROM bookings b
                    JOIN properties p ON b.property_id = p.property_id
                    WHERE b.customer_id = ? AND b.status = 'confirmed' AND b.check_in >= CURDATE()
                    ORDER BY b.check_in ASC LIMIT 1";
$upcoming_stmt = mysqli_prepare($conn, $upcoming_query);
mysqli_stmt_bind_param($upcoming_stmt, "i", $customer_id);
mysqli_stmt_execute($upcoming_stmt);
$upcoming_booking = mysqli_fetch_assoc(mysqli_stmt_get_result($upcoming_stmt));
mysqli_stmt_close($upcoming_stmt);

// -------------------- MOST RECENT BOOKING (by creation date) --------------------
$recent_query = "SELECT b.booking_id, b.booking_number, b.check_in, b.check_out, b.status, p.title AS property_title
                  FROM bookings b
                  JOIN properties p ON b.property_id = p.property_id
                  WHERE b.customer_id = ?
                  ORDER BY b.created_at DESC LIMIT 1";
$recent_stmt = mysqli_prepare($conn, $recent_query);
mysqli_stmt_bind_param($recent_stmt, "i", $customer_id);
mysqli_stmt_execute($recent_stmt);
$recent_booking = mysqli_fetch_assoc(mysqli_stmt_get_result($recent_stmt));
mysqli_stmt_close($recent_stmt);

// -------------------- WISHLIST COUNT --------------------
$wishlist_query = "SELECT COUNT(*) AS total FROM wishlists WHERE customer_id = ?";
$wishlist_stmt = mysqli_prepare($conn, $wishlist_query);
mysqli_stmt_bind_param($wishlist_stmt, "i", $customer_id);
mysqli_stmt_execute($wishlist_stmt);
$wishlist_count = mysqli_fetch_assoc(mysqli_stmt_get_result($wishlist_stmt))['total'];
mysqli_stmt_close($wishlist_stmt);

// -------------------- COMPLETED STAY COUNT --------------------
$completed_query = "SELECT COUNT(*) AS total FROM bookings WHERE customer_id = ? AND status = 'completed'";
$completed_stmt = mysqli_prepare($conn, $completed_query);
mysqli_stmt_bind_param($completed_stmt, "i", $customer_id);
mysqli_stmt_execute($completed_stmt);
$completed_count = mysqli_fetch_assoc(mysqli_stmt_get_result($completed_stmt))['total'];
mysqli_stmt_close($completed_stmt);

mysqli_close($conn);

send_response("success", "Dashboard loaded successfully.", [
    "upcoming_booking" => $upcoming_booking,   // null if none
    "recent_booking" => $recent_booking,       // null if none
    "wishlist_count" => (int) $wishlist_count,
    "completed_count" => (int) $completed_count,
]);
?>
