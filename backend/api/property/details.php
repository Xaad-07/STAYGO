<?php
// ============================================================
// details.php
// Returns full details for a single property: info, all images,
// amenities, host info, and review summary.
// Example: details.php?property_id=5
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

$property_id = $_GET['property_id'] ?? '';

if (!is_numeric($property_id)) {
    send_response("error", "A valid property ID is required.");
}

// -------------------- MAIN PROPERTY INFO + HOST NAME --------------------

$query = "SELECT p.*, u.full_name AS host_name, u.email AS host_email
          FROM properties p
          JOIN users u ON p.host_id = u.user_id
          WHERE p.property_id = ?";

$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "i", $property_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$property = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

if (!$property) {
    send_response("error", "Property not found.");
}

// -------------------- IMAGES --------------------

$images_query = "SELECT image_id, image_path, is_primary FROM property_images
                  WHERE property_id = ? ORDER BY is_primary DESC, image_id ASC";
$images_stmt = mysqli_prepare($conn, $images_query);
mysqli_stmt_bind_param($images_stmt, "i", $property_id);
mysqli_stmt_execute($images_stmt);
$images_result = mysqli_stmt_get_result($images_stmt);

$images = [];
while ($row = mysqli_fetch_assoc($images_result)) {
    $images[] = $row;
}
mysqli_stmt_close($images_stmt);

// -------------------- AMENITIES --------------------

$amenities_query = "SELECT a.amenity_id, a.amenity_name
                     FROM property_amenities pa
                     JOIN amenities a ON pa.amenity_id = a.amenity_id
                     WHERE pa.property_id = ?";
$amenities_stmt = mysqli_prepare($conn, $amenities_query);
mysqli_stmt_bind_param($amenities_stmt, "i", $property_id);
mysqli_stmt_execute($amenities_stmt);
$amenities_result = mysqli_stmt_get_result($amenities_stmt);

$amenities = [];
while ($row = mysqli_fetch_assoc($amenities_result)) {
    $amenities[] = $row;
}
mysqli_stmt_close($amenities_stmt);

// -------------------- REVIEWS --------------------

$reviews_query = "SELECT r.rating, r.comment, r.created_at, u.full_name AS customer_name
                   FROM reviews r
                   JOIN users u ON r.customer_id = u.user_id
                   WHERE r.property_id = ?
                   ORDER BY r.created_at DESC";
$reviews_stmt = mysqli_prepare($conn, $reviews_query);
mysqli_stmt_bind_param($reviews_stmt, "i", $property_id);
mysqli_stmt_execute($reviews_stmt);
$reviews_result = mysqli_stmt_get_result($reviews_stmt);

$reviews = [];
while ($row = mysqli_fetch_assoc($reviews_result)) {
    $reviews[] = $row;
}
mysqli_stmt_close($reviews_stmt);

mysqli_close($conn);

$property['images'] = $images;
$property['amenities'] = $amenities;
$property['reviews'] = $reviews;
$property['review_count'] = count($reviews);

send_response("success", "Property details loaded successfully.", ["property" => $property]);
?>
