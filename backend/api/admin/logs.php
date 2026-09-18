<?php
// ============================================================
// logs.php (admin)
// Lists recent activity log entries for the Admin > Activity Logs page.
// ============================================================

require_once __DIR__ . '/../../config/db.php';
session_start();
require_once __DIR__ . '/../../utils/helpers.php';

require_role('admin');

// Most recent 200 entries is plenty for a project-scale admin view.
$query = "SELECT a.log_id, a.action, a.ip_address, a.created_at, u.full_name AS user_name, u.email AS user_email
          FROM activity_logs a
          LEFT JOIN users u ON a.user_id = u.user_id
          ORDER BY a.created_at DESC
          LIMIT 200";

$result = mysqli_query($conn, $query);

$logs = [];
while ($row = mysqli_fetch_assoc($result)) {
    $logs[] = $row;
}

mysqli_close($conn);
send_response("success", "Activity logs loaded successfully.", ["logs" => $logs]);
?>
