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

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadProperties();
  }, []);

  function loadProperties() {
    setLoading(true);
    api.get("/admin/properties.php")
      .then((res) => {
        if (res.data.status === "success") setProperties(res.data.properties);
        else setError(res.data.message);
      })
      .catch(() => setError("Unable to connect to the server. Please try again."))
      .finally(() => setLoading(false));
  }

  async function confirmDelete(propertyId) {
    try {
      const res = await api.post("/admin/properties.php", { property_id: propertyId });
      if (res.data.status === "success") {
        setProperties((prev) => prev.filter((p) => p.property_id !== propertyId));
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Properties</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>Property</th>
              <th style={{ padding: 10 }}>Host</th>
              <th style={{ padding: 10 }}>City</th>
              <th style={{ padding: 10 }}>Price</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Rating</th>
              <th style={{ padding: 10 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.property_id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 10 }}>{p.title}</td>
                <td style={{ padding: 10 }}>{p.host_name}</td>
                <td style={{ padding: 10 }}>{p.city}</td>
                <td style={{ padding: 10 }}>₹{p.price_per_night}</td>
                <td style={{ padding: 10 }}>{p.status}</td>
                <td style={{ padding: 10 }}>{p.rating}</td>
                <td style={{ padding: 10 }}>
                  {deletingId === p.property_id ? (
                    <span>
                      <span style={{ fontSize: 13, marginRight: 6 }}>Delete?</span>
                      <button className="btn-link" style={{ color: "var(--color-error)", marginRight: 8 }} onClick={() => confirmDelete(p.property_id)}>
                        Yes
                      </button>
                      <button className="btn-link" onClick={() => setDeletingId(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button className="btn-link" style={{ color: "var(--color-error)" }} onClick={() => setDeletingId(p.property_id)}>
                      Delete
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
