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

// Lists all users (customers, hosts, admins). Admin accounts cannot be
// suspended from here -- the backend enforces this even if somehow bypassed
// on the frontend.
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users.php");
      if (res.data.status === "success") {
        setUsers(res.data.users);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await api.post("/admin/users.php", { user_id: userId, status: newStatus });
      if (res.data.status === "success") {
        setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u)));
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    }
  }

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Users</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>Name</th>
              <th style={{ padding: 10 }}>Email</th>
              <th style={{ padding: 10 }}>Phone</th>
              <th style={{ padding: 10 }}>Role</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Created</th>
              <th style={{ padding: 10 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 10 }}>{u.full_name}</td>
                <td style={{ padding: 10 }}>{u.email}</td>
                <td style={{ padding: 10 }}>{u.phone}</td>
                <td style={{ padding: 10, textTransform: "capitalize" }}>{u.role}</td>
                <td style={{ padding: 10, textTransform: "capitalize", color: u.status === "active" ? "var(--color-success)" : "var(--color-error)" }}>
                  {u.status}
                </td>
                <td style={{ padding: 10 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: 10 }}>
                  {u.role !== "admin" && (
                    <button className="btn-link" onClick={() => toggleStatus(u.user_id, u.status)}>
                      {u.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </DashboardLayout>
  );
}
