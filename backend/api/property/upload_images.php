<?php
// ============================================================
// upload_images.php
// Uploads one or more images for a property the host owns.
// Validates actual file content (MIME type via finfo), not just
// the filename extension, since extensions can be faked.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('host');

$property_id = $_POST['property_id'] ?? '';

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
    send_response("error", "You are not authorized to upload images for this property.");
}

// -------------------- VALIDATION RULES --------------------

$max_file_size = 5 * 1024 * 1024; // 5 MB per image
$max_images = 8;                  // maximum images per property
$allowed_mime_types = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

if (!isset($_FILES['images'])) {
    send_response("error", "No images were uploaded.");
}

// Normalize $_FILES['images'] (which arrives as parallel arrays) into a simple list.
$files = $_FILES['images'];
$file_count = count($files['name']);

if ($file_count === 0) {
    send_response("error", "No images were uploaded.");
}

// -------------------- CHECK HOW MANY IMAGES THIS PROPERTY ALREADY HAS --------------------

$count_query = "SELECT COUNT(*) AS total FROM property_images WHERE property_id = ?";
$count_stmt = mysqli_prepare($conn, $count_query);
mysqli_stmt_bind_param($count_stmt, "i", $property_id);
mysqli_stmt_execute($count_stmt);
$count_result = mysqli_stmt_get_result($count_stmt);
$existing_count = mysqli_fetch_assoc($count_result)['total'];
mysqli_stmt_close($count_stmt);

if ($existing_count + $file_count > $max_images) {
    send_response("error", "A property can have a maximum of $max_images images.");
}

$upload_dir = __DIR__ . '/../../uploads/properties/';
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$uploaded_paths = [];

// -------------------- VALIDATE AND SAVE EACH FILE --------------------

for ($i = 0; $i < $file_count; $i++) {
    $tmp_name = $files['tmp_name'][$i];
    $error_code = $files['error'][$i];
    $size = $files['size'][$i];

    if ($error_code !== UPLOAD_ERR_OK) {
        send_response("error", "One of the files failed to upload.");
    }

    if ($size > $max_file_size) {
        send_response("error", "Each image must be smaller than 5 MB.");
    }

    // Detect the REAL mime type by reading the file content, not the filename.
    $detected_mime = finfo_file($finfo, $tmp_name);

    if (!array_key_exists($detected_mime, $allowed_mime_types)) {
        send_response("error", "Only JPEG, PNG and WEBP images are allowed.");
    }

    // Build a safe, unique filename -- never trust the original filename.
    $extension = $allowed_mime_types[$detected_mime];
    $safe_filename = "prop_{$property_id}_" . uniqid() . "." . $extension;
    $destination = $upload_dir . $safe_filename;

    if (!move_uploaded_file($tmp_name, $destination)) {
        send_response("error", "Unable to save one of the images.");
    }

    $uploaded_paths[] = $safe_filename;
}

finfo_close($finfo);

// -------------------- SAVE PATHS TO DATABASE --------------------

$insert_query = "INSERT INTO property_images (property_id, image_path, is_primary) VALUES (?, ?, ?)";
$insert_stmt = mysqli_prepare($conn, $insert_query);

foreach ($uploaded_paths as $index => $path) {
    // The very first image uploaded for a property becomes the primary image
    // only if the property doesn't already have one.
    $is_primary = ($existing_count === 0 && $index === 0) ? 1 : 0;
    mysqli_stmt_bind_param($insert_stmt, "isi", $property_id, $path, $is_primary);
    mysqli_stmt_execute($insert_stmt);
}
mysqli_stmt_close($insert_stmt);
mysqli_close($conn);

send_response("success", "Images uploaded successfully.", ["uploaded" => $uploaded_paths]);
?>
