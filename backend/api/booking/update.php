<?php
// ============================================================
// update.php (booking)
// Two distinct actions share this endpoint, selected by "action":
//   - action = "cancel"        -> customer cancels their own booking.
//   - action = "update_pickup" -> host fills in driver/vehicle/charge info.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_login();

$data = json_decode(file_get_contents("php://input"), true);
$booking_id = $data['booking_id'] ?? '';
$action = $data['action'] ?? '';

if (!is_numeric($booking_id)) {
    send_response("error", "A valid booking ID is required.");
}

// -------------------- LOAD BOOKING + OWNERSHIP INFO --------------------

$lookup_query = "SELECT b.customer_id, b.status, p.host_id
                  FROM bookings b
                  JOIN properties p ON b.property_id = p.property_id
                  WHERE b.booking_id = ?";
$lookup_stmt = mysqli_prepare($conn, $lookup_query);
mysqli_stmt_bind_param($lookup_stmt, "i", $booking_id);
mysqli_stmt_execute($lookup_stmt);
$lookup_result = mysqli_stmt_get_result($lookup_stmt);
$booking = mysqli_fetch_assoc($lookup_result);
mysqli_stmt_close($lookup_stmt);

if (!$booking) {
    send_response("error", "Booking not found.");
}

$user_id = $_SESSION['user_id'];

// -------------------- ACTION: CANCEL (customer only, own booking) --------------------

if ($action === 'cancel') {
    if ($_SESSION['role'] !== 'customer' || (int) $booking['customer_id'] !== (int) $user_id) {
        http_response_code(403);
        send_response("error", "You are not authorized to cancel this booking.");
    }
    if ($booking['status'] !== 'confirmed') {
        send_response("error", "Only confirmed bookings can be cancelled.");
    }

    $update_query = "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?";
    $update_stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($update_stmt, "i", $booking_id);

    if (mysqli_stmt_execute($update_stmt)) {
        log_activity($conn, $user_id, "Booking Cancelled");
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("success", "Booking cancelled successfully.");
    } else {
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to cancel booking. Please try again.");
    }
}

// -------------------- ACTION: UPDATE PICKUP (host only, own property) --------------------

if ($action === 'update_pickup') {
    if ($_SESSION['role'] !== 'host' || (int) $booking['host_id'] !== (int) $user_id) {
        http_response_code(403);
        send_response("error", "You are not authorized to update this booking's pickup details.");
    }

    $driver_name = trim($data['driver_name'] ?? '');
    $driver_phone = trim($data['driver_phone'] ?? '');
    $vehicle_number = trim($data['vehicle_number'] ?? '');
    $pickup_charge = $data['pickup_charge'] ?? 0;
    $final_pickup_time = trim($data['final_pickup_time'] ?? '');

    if (!is_numeric($pickup_charge) || $pickup_charge < 0) {
        send_response("error", "Please enter a valid pickup charge.");
    }

    $update_query = "UPDATE bookings SET
                        driver_name = ?, driver_phone = ?, vehicle_number = ?,
                        pickup_charge = ?, final_pickup_time = ?
                      WHERE booking_id = ?";
    $update_stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param(
        $update_stmt,
        "sssdsi",
        $driver_name, $driver_phone, $vehicle_number, $pickup_charge, $final_pickup_time, $booking_id
    );

    if (mysqli_stmt_execute($update_stmt)) {
        log_activity($conn, $user_id, "Profile Updated");
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("success", "Pickup details updated successfully.");
    } else {
        mysqli_stmt_close($update_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to update pickup details. Please try again.");
    }
}

// If we reach here, the action was not recognized.
send_response("error", "Invalid action.");
?>
