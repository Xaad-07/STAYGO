<?php
// ============================================================
// read.php (review)
// Returns reviews either for a given property (public, e.g. for the
// property details page) or for the logged-in customer (My Reviews page),
// depending on which query parameter is supplied.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

$property_id = $_GET['property_id'] ?? '';
$mine = isset($_GET['mine']) && $_GET['mine'] === '1';
$host_view = isset($_GET['host_view']) && $_GET['host_view'] === '1';

if ($mine) {
    // "My Reviews" -- requires login.
    require_login();
    $customer_id = $_SESSION['user_id'];

    $query = "SELECT r.review_id, r.booking_id, r.rating, r.comment, r.created_at,
                     p.title AS property_title, p.property_id
              FROM reviews r
              JOIN properties p ON r.property_id = p.property_id
              WHERE r.customer_id = ?
              ORDER BY r.created_at DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $customer_id);

} elseif ($host_view) {
    // Host Reviews page -- every review across all of this host's properties.
    require_role('host');
    $host_id = $_SESSION['user_id'];

    $query = "SELECT r.review_id, r.rating, r.comment, r.created_at,
                     u.full_name AS customer_name, p.title AS property_title
              FROM reviews r
              JOIN properties p ON r.property_id = p.property_id
              JOIN users u ON r.customer_id = u.user_id
              WHERE p.host_id = ?
              ORDER BY r.created_at DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $host_id);

} elseif (is_numeric($property_id)) {
    // Public reviews for a specific property.
    $query = "SELECT r.review_id, r.rating, r.comment, r.created_at, u.full_name AS customer_name
              FROM reviews r
              JOIN users u ON r.customer_id = u.user_id
              WHERE r.property_id = ?
              ORDER BY r.created_at DESC";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $property_id);

} else {
    send_response("error", "A property ID is required.");
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$reviews = [];
while ($row = mysqli_fetch_assoc($result)) {
    $reviews[] = $row;
}
mysqli_stmt_close($stmt);
mysqli_close($conn);

send_response("success", "Reviews loaded successfully.", ["reviews" => $reviews]);
?>
