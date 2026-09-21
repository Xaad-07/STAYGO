<?php
// ============================================================
// read.php
// Returns a list of properties. Supports optional search, filter
// and sort parameters via GET so both the Home search and the
// Properties page can reuse the same endpoint.
//
// Example: read.php?city=Goa&property_type=Villa&max_price=5000&sort=price_low
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

// Read optional filters from the query string. All are optional.
$city = trim($_GET['city'] ?? '');
$property_type = trim($_GET['property_type'] ?? '');
$max_price = $_GET['max_price'] ?? '';
$guests = $_GET['guests'] ?? '';
$pickup_only = isset($_GET['pickup_only']) && $_GET['pickup_only'] === '1';
$sort = $_GET['sort'] ?? 'recommended';
$host_id = $_GET['host_id'] ?? ''; // used by "My Properties" for a host

// Base query: only show active properties, with the primary image and average rating.
$query = "SELECT p.property_id, p.title, p.city, p.state, p.property_type,
                 p.price_per_night, p.guests, p.bedrooms, p.bathrooms,
                 p.pickup_available, p.status, p.rating,
                 (SELECT image_path FROM property_images pi
                    WHERE pi.property_id = p.property_id
                    ORDER BY pi.is_primary DESC, pi.image_id ASC LIMIT 1) AS primary_image
          FROM properties p
          WHERE 1 = 1";

$params = [];
$types = "";

// Host's own listing view intentionally shows all statuses; public search only shows active ones.
if ($host_id !== '' && is_numeric($host_id)) {
    $query .= " AND p.host_id = ?";
    $types .= "i";
    $params[] = (int) $host_id;
} else {
    $query .= " AND p.status = 'active'";
}

// Search across city, state and country together, so typing either the
// city ("Udaipur") or the region/state ("Rajasthan") both work.
$city = trim($city);
if ($city !== '') {
    $query .= " AND (LOWER(p.city) LIKE LOWER(?) OR LOWER(p.state) LIKE LOWER(?) OR LOWER(p.country) LIKE LOWER(?))";
    $types .= "sss";
    $params[] = "%" . $city . "%";
    $params[] = "%" . $city . "%";
    $params[] = "%" . $city . "%";
}

if ($property_type !== '') {
    $query .= " AND p.property_type = ?";
    $types .= "s";
    $params[] = $property_type;
}

if (is_numeric($max_price)) {
    $query .= " AND p.price_per_night <= ?";
    $types .= "d";
    $params[] = (float) $max_price;
}

if (is_numeric($guests)) {
    $query .= " AND p.guests >= ?";
    $types .= "i";
    $params[] = (int) $guests;
}

if ($pickup_only) {
    $query .= " AND p.pickup_available = 1";
}

// Sorting options exposed on the Properties page.
switch ($sort) {
    case "price_low":
        $query .= " ORDER BY p.price_per_night ASC";
        break;
    case "price_high":
        $query .= " ORDER BY p.price_per_night DESC";
        break;
    case "rating":
        $query .= " ORDER BY p.rating DESC";
        break;
    default:
        $query .= " ORDER BY p.created_at DESC";
}

$stmt = mysqli_prepare($conn, $query);

// Bind parameters dynamically since the filter list changes based on what was sent.
if (count($params) > 0) {
    mysqli_stmt_bind_param($stmt, $types, ...$params);
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$properties = [];
while ($row = mysqli_fetch_assoc($result)) {
    $properties[] = $row;
}

mysqli_stmt_close($stmt);
mysqli_close($conn);

if (count($properties) > 0) {
    send_response("success", "Properties loaded successfully.", ["properties" => $properties]);
} else {
    send_response("success", "No properties found.", ["properties" => []]);
}
?>
