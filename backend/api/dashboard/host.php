<?php
// ============================================================
// host.php (dashboard)
// Returns the summary data shown on the Host Dashboard:
// total properties, total bookings, revenue, average rating,
// and the 5 most recent bookings across the host's properties.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('host');

$host_id = $_SESSION['user_id'];

// -------------------- TOTAL PROPERTIES --------------------
$properties_query = "SELECT COUNT(*) AS total FROM properties WHERE host_id = ?";
$properties_stmt = mysqli_prepare($conn, $properties_query);
mysqli_stmt_bind_param($properties_stmt, "i", $host_id);
mysqli_stmt_execute($properties_stmt);
$total_properties = mysqli_fetch_assoc(mysqli_stmt_get_result($properties_stmt))['total'];
mysqli_stmt_close($properties_stmt);

// -------------------- TOTAL BOOKINGS + REVENUE --------------------
// Revenue only counts confirmed and completed bookings -- cancelled
// bookings never happened financially.
$bookings_query = "SELECT
                        COUNT(*) AS total_bookings,
                        COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.total_amount ELSE 0 END), 0) AS revenue
                    FROM bookings b
                    JOIN properties p ON b.property_id = p.property_id
                    WHERE p.host_id = ?";
$bookings_stmt = mysqli_prepare($conn, $bookings_query);
mysqli_stmt_bind_param($bookings_stmt, "i", $host_id);
mysqli_stmt_execute($bookings_stmt);
$booking_totals = mysqli_fetch_assoc(mysqli_stmt_get_result($bookings_stmt));
mysqli_stmt_close($bookings_stmt);

// -------------------- AVERAGE RATING ACROSS ALL PROPERTIES --------------------
$rating_query = "SELECT AVG(rating) AS avg_rating FROM properties WHERE host_id = ? AND rating > 0";
$rating_stmt = mysqli_prepare($conn, $rating_query);
mysqli_stmt_bind_param($rating_stmt, "i", $host_id);
mysqli_stmt_execute($rating_stmt);
$avg_rating_row = mysqli_fetch_assoc(mysqli_stmt_get_result($rating_stmt));
$average_rating = $avg_rating_row['avg_rating'] !== null ? round($avg_rating_row['avg_rating'], 1) : 0;
mysqli_stmt_close($rating_stmt);

// -------------------- RECENT BOOKINGS (last 5) --------------------
$recent_query = "SELECT b.booking_id, b.booking_number, b.check_in, b.check_out, b.status, b.total_amount,
                         p.title AS property_title, u.full_name AS customer_name
                  FROM bookings b
                  JOIN properties p ON b.property_id = p.property_id
                  JOIN users u ON b.customer_id = u.user_id
                  WHERE p.host_id = ?
                  ORDER BY b.created_at DESC LIMIT 5";
$recent_stmt = mysqli_prepare($conn, $recent_query);
mysqli_stmt_bind_param($recent_stmt, "i", $host_id);
mysqli_stmt_execute($recent_stmt);
$recent_result = mysqli_stmt_get_result($recent_stmt);

$recent_bookings = [];
while ($row = mysqli_fetch_assoc($recent_result)) {
    $recent_bookings[] = $row;
}
mysqli_stmt_close($recent_stmt);

mysqli_close($conn);

send_response("success", "Dashboard loaded successfully.", [
    "total_properties" => (int) $total_properties,
    "total_bookings" => (int) $booking_totals['total_bookings'],
    "revenue" => (float) $booking_totals['revenue'],
    "average_rating" => (float) $average_rating,
    "recent_bookings" => $recent_bookings,
]);
?>
