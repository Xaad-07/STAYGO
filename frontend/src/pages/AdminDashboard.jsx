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

// Platform-wide overview: total counts, recent users, recent bookings,
// and recent activity -- all real data from admin/dashboard.php.
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/dashboard.php");
      if (res.data.status === "success") {
        setData(res.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Admin Dashboard</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
            <SummaryCard label="Total Users" value={data.total_users} />
            <SummaryCard label="Total Hosts" value={data.total_hosts} />
            <SummaryCard label="Total Properties" value={data.total_properties} />
            <SummaryCard label="Total Bookings" value={data.total_bookings} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <h3>Recent Users</h3>
              {data.recent_users.map((u) => (
                <div key={u.user_id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <strong>{u.full_name}</strong> · {u.role} · {u.status}
                </div>
              ))}
            </div>

            <div>
              <h3>Recent Bookings</h3>
              {data.recent_bookings.map((b) => (
                <div key={b.booking_id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                  {b.property_title} · {b.customer_name} · ₹{b.total_amount} · {b.status}
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>Recent Activity</h3>
          {data.recent_activity.map((log) => (
            <div key={log.log_id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
              {log.user_name || "Unknown"} · {log.action} · {new Date(log.created_at).toLocaleString()}
            </div>
          ))}
        </>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--color-text-light)" }}>{label}</div>
    </div>
  );
}
