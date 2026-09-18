import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/hosts", label: "Hosts" },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/messages", label: "Contact Messages" },
  { to: "/admin/logs", label: "Activity Logs" },
];

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/logs.php")
      .then((res) => {
        if (res.data.status === "success") setLogs(res.data.logs);
        else setError(res.data.message);
      })
      .catch(() => setError("Unable to connect to the server. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Activity Logs</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>User</th>
              <th style={{ padding: 10 }}>Action</th>
              <th style={{ padding: 10 }}>IP</th>
              <th style={{ padding: 10 }}>Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.log_id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 10 }}>{log.user_name || "Unknown"}</td>
                <td style={{ padding: 10 }}>{log.action}</td>
                <td style={{ padding: 10 }}>{log.ip_address}</td>
                <td style={{ padding: 10 }}>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </DashboardLayout>
  );
}
