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

export default function AdminHosts() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/hosts.php")
      .then((res) => {
        if (res.data.status === "success") setHosts(res.data.hosts);
        else setError(res.data.message);
      })
      .catch(() => setError("Unable to connect to the server. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Hosts</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>Host</th>
              <th style={{ padding: 10 }}>Email</th>
              <th style={{ padding: 10 }}>Properties</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {hosts.map((h) => (
              <tr key={h.user_id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 10 }}>{h.full_name}</td>
                <td style={{ padding: 10 }}>{h.email}</td>
                <td style={{ padding: 10 }}>{h.property_count}</td>
                <td style={{ padding: 10, textTransform: "capitalize" }}>{h.status}</td>
                <td style={{ padding: 10 }}>{new Date(h.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </DashboardLayout>
  );
}
