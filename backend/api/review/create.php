<?php
// ============================================================
// create.php (review)
// Lets a customer review a property, but only if they have a
// COMPLETED booking for it, and only once per booking.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('customer');

$data = json_decode(file_get_contents("php://input"), true);

$booking_id = $data['booking_id'] ?? '';
$rating = $data['rating'] ?? '';
$comment = trim($data['comment'] ?? '');

if (!is_numeric($booking_id)) {
    send_response("error", "A valid booking is required.");
}
if (!is_numeric($rating) || $rating < 1 || $rating > 5) {
    send_response("error", "Rating must be between 1 and 5.");
}
if (strlen($comment) < 5) {
    send_response("error", "Please write a comment of at least 5 characters.");
}

$customer_id = $_SESSION['user_id'];

// -------------------- VERIFY BOOKING BELONGS TO THIS CUSTOMER AND IS COMPLETED --------------------

$booking_query = "SELECT customer_id, property_id, status FROM bookings WHERE booking_id = ?";
$booking_stmt = mysqli_prepare($conn, $booking_query);
mysqli_stmt_bind_param($booking_stmt, "i", $booking_id);
mysqli_stmt_execute($booking_stmt);
$booking_result = mysqli_stmt_get_result($booking_stmt);
$booking = mysqli_fetch_assoc($booking_result);
mysqli_stmt_close($booking_stmt);

if (!$booking) {
    send_response("error", "Booking not found.");
}
if ((int) $booking['customer_id'] !== (int) $customer_id) {
    http_response_code(403);
    send_response("error", "You are not authorized to review this booking.");
}
if ($booking['status'] !== 'completed') {
    send_response("error", "You can only review a stay after it is completed.");
}

// -------------------- PREVENT DUPLICATE REVIEWS FOR THE SAME BOOKING --------------------

$existing_query = "SELECT review_id FROM reviews WHERE booking_id = ?";
$existing_stmt = mysqli_prepare($conn, $existing_query);
mysqli_stmt_bind_param($existing_stmt, "i", $booking_id);
mysqli_stmt_execute($existing_stmt);
$existing_result = mysqli_stmt_get_result($existing_stmt);

if (mysqli_num_rows($existing_result) > 0) {
    mysqli_stmt_close($existing_stmt);
    send_response("error", "You have already reviewed this booking.");
}
mysqli_stmt_close($existing_stmt);

// -------------------- INSERT REVIEW --------------------

$property_id = $booking['property_id'];

$insert_query = "INSERT INTO reviews (booking_id, customer_id, property_id, rating, comment)
                  VALUES (?, ?, ?, ?, ?)";
$insert_stmt = mysqli_prepare($conn, $insert_query);
mysqli_stmt_bind_param($insert_stmt, "iiiis", $booking_id, $customer_id, $property_id, $rating, $comment);

if (!mysqli_stmt_execute($insert_stmt)) {
    mysqli_stmt_close($insert_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to submit review. Please try again.");
}
mysqli_stmt_close($insert_stmt);

// -------------------- RECALCULATE THE PROPERTY'S AVERAGE RATING --------------------

$avg_query = "SELECT AVG(rating) AS avg_rating FROM reviews WHERE property_id = ?";
$avg_stmt = mysqli_prepare($conn, $avg_query);
mysqli_stmt_bind_param($avg_stmt, "i", $property_id);
mysqli_stmt_execute($avg_stmt);
$avg_result = mysqli_stmt_get_result($avg_stmt);
$avg_rating = round(mysqli_fetch_assoc($avg_result)['avg_rating'], 1);
mysqli_stmt_close($avg_stmt);

$update_query = "UPDATE properties SET rating = ? WHERE property_id = ?";
$update_stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($update_stmt, "di", $avg_rating, $property_id);
mysqli_stmt_execute($update_stmt);
mysqli_stmt_close($update_stmt);

log_activity($conn, $customer_id, "Review Added");
mysqli_close($conn);

send_response("success", "Review submitted successfully.");
?>
