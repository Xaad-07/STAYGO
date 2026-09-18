<?php
// ============================================================
// reviews.php (admin)
// GET  -> lists every review on the platform.
// POST -> deletes an inappropriate review.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT r.review_id, r.rating, r.comment, r.created_at,
                     p.title AS property_title, u.full_name AS customer_name
              FROM reviews r
              JOIN properties p ON r.property_id = p.property_id
              JOIN users u ON r.customer_id = u.user_id
              ORDER BY r.created_at DESC";
    $result = mysqli_query($conn, $query);

    $reviews = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $reviews[] = $row;
    }
    mysqli_close($conn);
    send_response("success", "Reviews loaded successfully.", ["reviews" => $reviews]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $review_id = $data['review_id'] ?? '';

    if (!is_numeric($review_id)) {
        send_response("error", "A valid review ID is required.");
    }

    // Find the property so we can recalculate its average rating after deletion.
    $lookup_query = "SELECT property_id FROM reviews WHERE review_id = ?";
    $lookup_stmt = mysqli_prepare($conn, $lookup_query);
    mysqli_stmt_bind_param($lookup_stmt, "i", $review_id);
    mysqli_stmt_execute($lookup_stmt);
    $lookup_result = mysqli_stmt_get_result($lookup_stmt);
    $review_row = mysqli_fetch_assoc($lookup_result);
    mysqli_stmt_close($lookup_stmt);

    if (!$review_row) {
        send_response("error", "Review not found.");
    }
    $property_id = $review_row['property_id'];

    $delete_query = "DELETE FROM reviews WHERE review_id = ?";
    $delete_stmt = mysqli_prepare($conn, $delete_query);
    mysqli_stmt_bind_param($delete_stmt, "i", $review_id);

    if (!mysqli_stmt_execute($delete_stmt)) {
        mysqli_stmt_close($delete_stmt);
        mysqli_close($conn);
        send_response("error", "Unable to delete review. Please try again.");
    }
    mysqli_stmt_close($delete_stmt);

    // Recalculate the property's average rating now that a review is gone.
    $avg_query = "SELECT AVG(rating) AS avg_rating FROM reviews WHERE property_id = ?";
    $avg_stmt = mysqli_prepare($conn, $avg_query);
    mysqli_stmt_bind_param($avg_stmt, "i", $property_id);
    mysqli_stmt_execute($avg_stmt);
    $avg_row = mysqli_fetch_assoc(mysqli_stmt_get_result($avg_stmt));
    $new_avg = $avg_row['avg_rating'] !== null ? round($avg_row['avg_rating'], 1) : 0;
    mysqli_stmt_close($avg_stmt);

    $update_query = "UPDATE properties SET rating = ? WHERE property_id = ?";
    $update_stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($update_stmt, "di", $new_avg, $property_id);
    mysqli_stmt_execute($update_stmt);
    mysqli_stmt_close($update_stmt);

    log_activity($conn, $_SESSION['user_id'], "Review Deleted");
    mysqli_close($conn);
    send_response("success", "Review deleted successfully.");
}
?>
