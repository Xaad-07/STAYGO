<?php
// ============================================================
// delete.php
// Lets a HOST delete a property they own.
// Related images, amenity links, wishlists etc. are removed
// automatically by the ON DELETE CASCADE foreign keys.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('host');

$data = json_decode(file_get_contents("php://input"), true);
$property_id = $data['property_id'] ?? '';

if (!is_numeric($property_id)) {
    send_response("error", "A valid property ID is required.");
}

// -------------------- OWNERSHIP CHECK --------------------

$owner_query = "SELECT host_id FROM properties WHERE property_id = ?";
$owner_stmt = mysqli_prepare($conn, $owner_query);
mysqli_stmt_bind_param($owner_stmt, "i", $property_id);
mysqli_stmt_execute($owner_stmt);
$owner_result = mysqli_stmt_get_result($owner_stmt);
$owner_row = mysqli_fetch_assoc($owner_result);
mysqli_stmt_close($owner_stmt);

if (!$owner_row) {
    send_response("error", "Property not found.");
}
if ((int) $owner_row['host_id'] !== (int) $_SESSION['user_id']) {
    http_response_code(403);
    send_response("error", "You are not authorized to delete this property.");
}

// -------------------- DELETE IMAGE FILES FROM DISK --------------------

// Remove the physical image files before deleting the database rows.
$images_query = "SELECT image_path FROM property_images WHERE property_id = ?";
$images_stmt = mysqli_prepare($conn, $images_query);
mysqli_stmt_bind_param($images_stmt, "i", $property_id);
mysqli_stmt_execute($images_stmt);
$images_result = mysqli_stmt_get_result($images_stmt);

while ($row = mysqli_fetch_assoc($images_result)) {
    $file_path = __DIR__ . '/../../uploads/properties/' . basename($row['image_path']);
    if (file_exists($file_path)) {
        unlink($file_path);
    }
}
mysqli_stmt_close($images_stmt);

// -------------------- DELETE PROPERTY --------------------

// Deleting the property row cascades to property_images, property_amenities,
// bookings, reviews and wishlists thanks to ON DELETE CASCADE in the schema.
$delete_query = "DELETE FROM properties WHERE property_id = ?";
$delete_stmt = mysqli_prepare($conn, $delete_query);
mysqli_stmt_bind_param($delete_stmt, "i", $property_id);

if (mysqli_stmt_execute($delete_stmt)) {
    log_activity($conn, $_SESSION['user_id'], "Property Deleted");
    mysqli_stmt_close($delete_stmt);
    mysqli_close($conn);
    send_response("success", "Property deleted successfully.");
} else {
    mysqli_stmt_close($delete_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to delete property. Please try again.");
}
?>
