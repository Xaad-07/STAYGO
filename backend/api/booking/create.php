<?php
// ============================================================
// create.php (booking)
// Creates a booking after validating dates, guest count and
// availability, calculates the total price, and simulates payment.
// A booking becomes CONFIRMED immediately since this is a simulation
// (no real payment gateway / approval bottleneck, per project spec).
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

// Only a logged-in customer can create a booking.
require_role('customer');

$data = json_decode(file_get_contents("php://input"), true);

$property_id = $data['property_id'] ?? '';
$check_in = $data['check_in'] ?? '';
$check_out = $data['check_out'] ?? '';
$guests = $data['guests'] ?? '';
$pickup_required = !empty($data['pickup_required']) ? 1 : 0;
$pickup_location = trim($data['pickup_location'] ?? '');
$pickup_date = $data['pickup_date'] ?? null;
$pickup_time = trim($data['pickup_time'] ?? '');
$pickup_instructions = trim($data['pickup_instructions'] ?? '');
$payment_method = $data['payment_method'] ?? '';

// -------------------- BASIC FIELD VALIDATION --------------------

if (!is_numeric($property_id)) {
    send_response("error", "A valid property is required.");
}

// Check-in/out must be real calendar dates in Y-m-d format.
$checkin_date = DateTime::createFromFormat('Y-m-d', $check_in);
$checkout_date = DateTime::createFromFormat('Y-m-d', $check_out);

if (!$checkin_date || !$checkout_date) {
    send_response("error", "Please provide valid check-in and check-out dates.");
}

$today = new DateTime('today');

if ($checkin_date < $today) {
    send_response("error", "Check-in date cannot be in the past.");
}
if ($checkout_date <= $checkin_date) {
    send_response("error", "Check-out date must be after the check-in date.");
}
if (!is_numeric($guests) || $guests < 1) {
    send_response("error", "Please enter a valid number of guests.");
}

$allowed_payment_methods = ['UPI', 'Card', 'Wallet', 'Cash'];
if (!in_array($payment_method, $allowed_payment_methods)) {
    send_response("error", "Please select a valid payment method.");
}

if ($pickup_required) {
    if ($pickup_location === '' || $pickup_date === null || $pickup_time === '') {
        send_response("error", "Please complete all pickup details.");
    }
}

// -------------------- PROPERTY LOOKUP --------------------

$property_query = "SELECT property_id, price_per_night, guests AS max_guests, status
                    FROM properties WHERE property_id = ?";
$property_stmt = mysqli_prepare($conn, $property_query);
mysqli_stmt_bind_param($property_stmt, "i", $property_id);
mysqli_stmt_execute($property_stmt);
$property_result = mysqli_stmt_get_result($property_stmt);
$property = mysqli_fetch_assoc($property_result);
mysqli_stmt_close($property_stmt);

if (!$property) {
    send_response("error", "Property not found.");
}
if ($property['status'] !== 'active') {
    send_response("error", "This property is not currently available for booking.");
}
if ($guests > $property['max_guests']) {
    send_response("error", "This property allows a maximum of {$property['max_guests']} guests.");
}

// -------------------- OVERLAP / AVAILABILITY CHECK --------------------
// Two date ranges [A_start, A_end) and [B_start, B_end) overlap when
// A_start < B_end AND A_end > B_start. We only need to block against
// bookings that are still 'confirmed' -- cancelled bookings free up the dates.
$overlap_query = "SELECT booking_id FROM bookings
                   WHERE property_id = ?
                     AND status = 'confirmed'
                     AND check_in < ?
                     AND check_out > ?";
$overlap_stmt = mysqli_prepare($conn, $overlap_query);
$check_in_str = $checkin_date->format('Y-m-d');
$check_out_str = $checkout_date->format('Y-m-d');
mysqli_stmt_bind_param($overlap_stmt, "iss", $property_id, $check_out_str, $check_in_str);
mysqli_stmt_execute($overlap_stmt);
$overlap_result = mysqli_stmt_get_result($overlap_stmt);
$has_overlap = mysqli_num_rows($overlap_result) > 0;
mysqli_stmt_close($overlap_stmt);

if ($has_overlap) {
    send_response("error", "This property is not available for the selected dates.");
}

// -------------------- PRICE CALCULATION --------------------

$nights = $checkin_date->diff($checkout_date)->days;
$price_per_night = (float) $property['price_per_night'];
$subtotal = $price_per_night * $nights;
$tax_rate = 0.05; // simple flat 5% tax for the project
$tax_amount = round($subtotal * $tax_rate, 2);

// Pickup charge is a simple flat fee for this simulation; the host can
// adjust the real amount later from the Pickup Requests screen.
$pickup_charge = $pickup_required ? 300.00 : 0.00;

$total_amount = round($subtotal + $tax_amount + $pickup_charge, 2);

// -------------------- GENERATE BOOKING + TRANSACTION NUMBERS --------------------

$booking_number = "SG" . date("ymd") . strtoupper(substr(uniqid(), -6));
$transaction_number = "TXN" . strtoupper(substr(uniqid(), -10));

// -------------------- INSERT BOOKING --------------------

$customer_id = $_SESSION['user_id'];

$insert_query = "INSERT INTO bookings
    (booking_number, customer_id, property_id, check_in, check_out, guests,
     price_per_night, nights, subtotal, tax_amount,
     pickup_required, pickup_location, pickup_date, pickup_time, pickup_instructions, pickup_charge,
     total_amount, payment_method, transaction_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')";

$insert_stmt = mysqli_prepare($conn, $insert_query);
mysqli_stmt_bind_param(
    $insert_stmt,
    "siissididdissssddss",
    $booking_number,       // s
    $customer_id,          // i
    $property_id,          // i
    $check_in_str,         // s
    $check_out_str,        // s
    $guests,               // i
    $price_per_night,      // d
    $nights,               // i
    $subtotal,             // d
    $tax_amount,           // d
    $pickup_required,      // i
    $pickup_location,      // s
    $pickup_date,          // s
    $pickup_time,          // s
    $pickup_instructions,  // s
    $pickup_charge,        // d
    $total_amount,         // d
    $payment_method,       // s
    $transaction_number    // s  (19 values total)
);

if (!mysqli_stmt_execute($insert_stmt)) {
    mysqli_stmt_close($insert_stmt);
    mysqli_close($conn);
    send_response("error", "Unable to create booking. Please try again.");
}

$booking_id = mysqli_insert_id($conn);
mysqli_stmt_close($insert_stmt);

log_activity($conn, $customer_id, "Booking Created");
mysqli_close($conn);

send_response("success", "Payment successful. Booking confirmed.", [
    "booking_id" => $booking_id,
    "booking_number" => $booking_number,
    "transaction_number" => $transaction_number,
    "total_amount" => $total_amount,
    "nights" => $nights,
    "subtotal" => $subtotal,
    "tax_amount" => $tax_amount,
    "pickup_charge" => $pickup_charge,
]);
?>
