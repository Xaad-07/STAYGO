<?php
// ============================================================
// hosts.php (admin)
// Lists all host accounts along with how many properties each
// one has listed, for the Admin > Hosts page.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

$query = "SELECT u.user_id, u.full_name, u.email, u.status, u.created_at,
                 (SELECT COUNT(*) FROM properties p WHERE p.host_id = u.user_id) AS property_count
          FROM users u
          WHERE u.role = 'host'
          ORDER BY u.created_at DESC";

$result = mysqli_query($conn, $query);

$hosts = [];
while ($row = mysqli_fetch_assoc($result)) {
    $hosts[] = $row;
}

mysqli_close($conn);
send_response("success", "Hosts loaded successfully.", ["hosts" => $hosts]);
?>
