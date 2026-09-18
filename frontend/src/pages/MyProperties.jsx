import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

const HOST_LINKS = [
  { to: "/host/dashboard", label: "Dashboard" },
  { to: "/host/properties", label: "My Properties" },
  { to: "/host/bookings", label: "Bookings" },
  { to: "/host/pickup-requests", label: "Pickup Requests" },
  { to: "/host/reviews", label: "Reviews" },
  { to: "/profile", label: "Profile" },
  { to: "/change-password", label: "Change Password" },
];

// Shows the logged-in host's own properties (read.php?host_id=...) with
// Edit and Delete actions. Delete requires a confirmation step, per spec.
export default function MyProperties() {
  const { user } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null); // property pending delete confirmation

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  async function loadProperties() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/property/read.php", {
        params: { host_id: user.user_id },
      });
      if (res.data.status === "success") {
        setProperties(res.data.properties);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete(propertyId) {
    try {
      const res = await api.post("/property/delete.php", { property_id: propertyId });
      if (res.data.status === "success") {
        // Remove it from the list immediately instead of re-fetching everything.
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

  if (loading) {
    return (
      <DashboardLayout links={HOST_LINKS}>
        <p>Loading your properties...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={HOST_LINKS}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>My Properties</h2>
        <Link to="/host/properties/add" className="btn btn-primary" style={{ maxWidth: 180 }}>
          + Add Property
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {properties.length === 0 ? (
        <p>You haven't listed any properties yet.</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>Property</th>
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
                <td style={{ padding: 10 }}>{p.city}</td>
                <td style={{ padding: 10 }}>₹{p.price_per_night}</td>
                <td style={{ padding: 10 }}>{p.status}</td>
                <td style={{ padding: 10 }}>{p.rating}</td>
                <td style={{ padding: 10 }}>
                  <Link to={`/host/properties/edit/${p.property_id}`} className="btn-link" style={{ marginRight: 12 }}>
                    Edit
                  </Link>

                  {deletingId === p.property_id ? (
                    <span>
                      <span style={{ fontSize: 13, marginRight: 6 }}>Delete this property?</span>
                      <button
                        className="btn-link"
                        style={{ color: "var(--color-error)", marginRight: 8 }}
                        onClick={() => confirmDelete(p.property_id)}
                      >
                        Yes, delete
                      </button>
                      <button className="btn-link" onClick={() => setDeletingId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      className="btn-link"
                      style={{ color: "var(--color-error)" }}
                      onClick={() => setDeletingId(p.property_id)}
                    >
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
