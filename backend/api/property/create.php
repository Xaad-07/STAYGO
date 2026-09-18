<?php
// ============================================================
// create.php
// Lets a logged-in HOST add a new property.
// Images are uploaded separately via upload_images.php after
// this call returns the new property_id.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

// Only a logged-in host can create a property.
require_role('host');

$data = json_decode(file_get_contents("php://input"), true);

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
$amenity_ids = $data['amenity_ids'] ?? []; // array of amenity_id values

// -------------------- VALIDATION --------------------

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

$host_id = $_SESSION['user_id'];

// -------------------- INSERT PROPERTY --------------------

$query = "INSERT INTO properties
    (host_id, title, description, property_type, address, city, state, country, pincode, price_per_night, guests, bedrooms, bathrooms, pickup_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param(
    $stmt,
    "issssssssdiiii",
    $host_id,           // i
    $title,             // s
    $description,       // s
    $property_type,     // s
    $address,           // s
    $city,              // s
    $state,             // s
    $country,           // s
    $pincode,           // s  (8 strings total)
    $price,             // d
    $guests,            // i
    $bedrooms,          // i
    $bathrooms,         // i
    $pickup_available   // i  (4 ints total)
);

if (!mysqli_stmt_execute($stmt)) {
    mysqli_stmt_close($stmt);
    mysqli_close($conn);
    send_response("error", "Unable to create property. Please try again.");
}

$property_id = mysqli_insert_id($conn);
mysqli_stmt_close($stmt);

// -------------------- LINK AMENITIES --------------------

// Insert one row per selected amenity into the junction table.
if (is_array($amenity_ids) && count($amenity_ids) > 0) {
    $amenity_query = "INSERT INTO property_amenities (property_id, amenity_id) VALUES (?, ?)";
    $amenity_stmt = mysqli_prepare($conn, $amenity_query);

    foreach ($amenity_ids as $amenity_id) {
        if (is_numeric($amenity_id)) {
            $amenity_id_int = (int) $amenity_id;
            mysqli_stmt_bind_param($amenity_stmt, "ii", $property_id, $amenity_id_int);
            mysqli_stmt_execute($amenity_stmt);
        }
    }
    mysqli_stmt_close($amenity_stmt);
}

log_activity($conn, $host_id, "Property Created");
mysqli_close($conn);

// Return the new property_id so the frontend can immediately upload images against it.
send_response("success", "Property created successfully.", ["property_id" => $property_id]);
?>
