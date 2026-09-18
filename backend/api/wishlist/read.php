<?php
// ============================================================
// read.php (wishlist)
// Returns the logged-in customer's wishlisted properties (for the
// Wishlist page), and also supports returning just the list of
// property_ids the customer has wishlisted (used by property cards
// to show the heart as filled/unfilled without loading full details).
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('customer');

$customer_id = $_SESSION['user_id'];
$ids_only = isset($_GET['ids_only']) && $_GET['ids_only'] === '1';

if ($ids_only) {
    // Lightweight response: just the property_ids, for marking hearts as filled.
    $query = "SELECT property_id FROM wishlists WHERE customer_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "i", $customer_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $ids = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $ids[] = (int) $row['property_id'];
    }
    mysqli_stmt_close($stmt);
    mysqli_close($conn);
    send_response("success", "Wishlist ids loaded.", ["property_ids" => $ids]);
}

// Full wishlist view with property card data.
$query = "SELECT p.property_id, p.title, p.city, p.state, p.property_type,
                 p.price_per_night, p.guests, p.bedrooms, p.bathrooms,
                 p.pickup_available, p.status, p.rating,
                 (SELECT image_path FROM property_images pi
                    WHERE pi.property_id = p.property_id
                    ORDER BY pi.is_primary DESC, pi.image_id ASC LIMIT 1) AS primary_image
          FROM wishlists w
          JOIN properties p ON w.property_id = p.property_id
          WHERE w.customer_id = ?
          ORDER BY w.created_at DESC";

$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $customer_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$properties = [];
while ($row = mysqli_fetch_assoc($result)) {
    $properties[] = $row;
}
mysqli_stmt_close($stmt);
mysqli_close($conn);

if (count($properties) > 0) {
    send_response("success", "Wishlist loaded successfully.", ["properties" => $properties]);
} else {
    send_response("success", "Your wishlist is empty.", ["properties" => []]);
}
?>
