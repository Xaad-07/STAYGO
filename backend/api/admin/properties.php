<?php
// ============================================================
// properties.php (admin)
// GET  -> lists every property on the platform with host info.
// POST -> lets the admin delete a property (moderation action).
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT p.property_id, p.title, p.city, p.price_per_night, p.status, p.rating,
                     u.full_name AS host_name
              FROM properties p
              JOIN users u ON p.host_id = u.user_id
              ORDER BY p.created_at DESC";
    $result = mysqli_query($conn, $query);

    $properties = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $properties[] = $row;
    }
    mysqli_close($conn);
    send_response("success", "Properties loaded successfully.", ["properties" => $properties]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // -------------------- ADMIN DELETE (MODERATION) --------------------
    $data = json_decode(file_get_contents("php://input"), true);
    $property_id = $data['property_id'] ?? '';

    if (!is_numeric($property_id)) {
        send_response("error", "A valid property ID is required.");
    }

    // Remove physical image files before deleting the DB row, same as the host's own delete.php.
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
}
?>
