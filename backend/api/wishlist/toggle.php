<?php
// ============================================================
// toggle.php (wishlist)
// Adds a property to the customer's wishlist if it isn't already
// there, or removes it if it is. This single "toggle" endpoint
// matches the heart-button UX: click once to add, click again to remove.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('customer');

$data = json_decode(file_get_contents("php://input"), true);
$property_id = $data['property_id'] ?? '';

if (!is_numeric($property_id)) {
    send_response("error", "A valid property ID is required.");
}

$customer_id = $_SESSION['user_id'];

// -------------------- CHECK IF ALREADY WISHLISTED --------------------

$check_query = "SELECT wishlist_id FROM wishlists WHERE customer_id = ? AND property_id = ?";
$check_stmt = mysqli_prepare($conn, $check_query);
mysqli_stmt_bind_param($check_stmt, "ii", $customer_id, $property_id);
mysqli_stmt_execute($check_stmt);
$check_result = mysqli_stmt_get_result($check_stmt);
$existing = mysqli_fetch_assoc($check_result);
mysqli_stmt_close($check_stmt);

if ($existing) {
    // Already wishlisted -> remove it (second click).
    $delete_query = "DELETE FROM wishlists WHERE wishlist_id = ?";
    $delete_stmt = mysqli_prepare($conn, $delete_query);
    mysqli_stmt_bind_param($delete_stmt, "i", $existing['wishlist_id']);
    mysqli_stmt_execute($delete_stmt);
    mysqli_stmt_close($delete_stmt);
    mysqli_close($conn);
    send_response("success", "Removed from wishlist.", ["wishlisted" => false]);
} else {
    // Not wishlisted yet -> add it (first click).
    $insert_query = "INSERT INTO wishlists (customer_id, property_id) VALUES (?, ?)";
    $insert_stmt = mysqli_prepare($conn, $insert_query);
    mysqli_stmt_bind_param($insert_stmt, "ii", $customer_id, $property_id);

    if (mysqli_stmt_execute($insert_stmt)) {
        mysqli_stmt_close($insert_stmt);
        mysqli_close($conn);
        send_response("success", "Added to wishlist.", ["wishlisted" => true]);
    } else {
        mysqli_stmt_close($insert_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to update wishlist. Please try again.");
    }
}
?>
