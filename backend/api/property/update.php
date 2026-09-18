<?php
// ============================================================
// update.php
// Lets a HOST edit a property they own.
// Amenity list is replaced (delete old links, insert new ones)
// since that is simpler and safer than diffing the two lists.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('host');

$data = json_decode(file_get_contents("php://input"), true);

$property_id = $data['property_id'] ?? '';
$title = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$property_type = $data['property_type'] ?? '';
$address = trim($data['address'] ?? '');
$city = trim($data['city'] ?? '');
$state = trim($data['state'] ?? '');
$country = trim($data['country'] ?? '');
$pincode = trim($data['pincode'] ?? '');
$price = $data['price'] ?? '';
$guests = $data['guests'] ?? '';
$bedrooms = $data['bedrooms'] ?? '';
$bathrooms = $data['bathrooms'] ?? '';
$pickup_available = !empty($data['pickup_available']) ? 1 : 0;
$amenity_ids = $data['amenity_ids'] ?? [];

if (!is_numeric($property_id)) {
    send_response("error", "A valid property ID is required.");
}

$allowed_types = ['Apartment','Villa','Hotel','Resort','Homestay','Cottage','Other'];

if ($title === '' || strlen($title) < 5) {
    send_response("error", "Title must be at least 5 characters long.");
}
if (!in_array($property_type, $allowed_types)) {
    send_response("error", "Please select a valid property type.");
}
if ($address === '' || $city === '' || $state === '' || $country === '') {
    send_response("error", "Address, city, state and country are required.");
}
if (!preg_match('/^[0-9]{4,10}$/', $pincode)) {
    send_response("error", "Please enter a valid PIN code.");
}
if (!is_numeric($price) || $price <= 0) {
    send_response("error", "Please enter a valid price per night.");
}
if (!is_numeric($guests) || $guests < 1) {
    send_response("error", "Guests must be at least 1.");
}
if (!is_numeric($bedrooms) || $bedrooms < 1) {
    send_response("error", "Bedrooms must be at least 1.");
}
if (!is_numeric($bathrooms) || $bathrooms < 1) {
    send_response("error", "Bathrooms must be at least 1.");
}

// -------------------- OWNERSHIP CHECK --------------------

// A host may only edit their own property, never someone else's.
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
    send_response("error", "You are not authorized to edit this property.");
}

// -------------------- UPDATE PROPERTY --------------------

$query = "UPDATE properties SET
            title = ?, description = ?, property_type = ?, address = ?, city = ?,
            state = ?, country = ?, pincode = ?, price_per_night = ?, guests = ?,
            bedrooms = ?, bathrooms = ?, pickup_available = ?
          WHERE property_id = ?";

$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param(
    $stmt,
    "ssssssssdiiiii",
    $title, $description, $property_type, $address, $city, $state, $country, $pincode,
    $price, $guests, $bedrooms, $bathrooms, $pickup_available, $property_id
);

if (!mysqli_stmt_execute($stmt)) {
    mysqli_stmt_close($stmt);
    mysqli_close($conn);
    send_response("error", "Unable to update property. Please try again.");
}
mysqli_stmt_close($stmt);

// -------------------- REPLACE AMENITIES --------------------

$delete_amenities = "DELETE FROM property_amenities WHERE property_id = ?";
$delete_stmt = mysqli_prepare($conn, $delete_amenities);
mysqli_stmt_bind_param($delete_stmt, "i", $property_id);
mysqli_stmt_execute($delete_stmt);
mysqli_stmt_close($delete_stmt);

if (is_array($amenity_ids) && count($amenity_ids) > 0) {
    $insert_amenity = "INSERT INTO property_amenities (property_id, amenity_id) VALUES (?, ?)";
    $insert_stmt = mysqli_prepare($conn, $insert_amenity);

    foreach ($amenity_ids as $amenity_id) {
        if (is_numeric($amenity_id)) {
            $amenity_id_int = (int) $amenity_id;
            mysqli_stmt_bind_param($insert_stmt, "ii", $property_id, $amenity_id_int);
            mysqli_stmt_execute($insert_stmt);
        }
    }
    mysqli_stmt_close($insert_stmt);
}

log_activity($conn, $_SESSION['user_id'], "Property Updated");
mysqli_close($conn);

send_response("success", "Property updated successfully.");
?>
