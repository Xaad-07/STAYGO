import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
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

// Host's landing dashboard: total properties, total bookings, revenue,
// average rating, and the 5 most recent bookings -- all real data from
// dashboard/host.php.
export default function HostDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/dashboard/host.php");
      if (res.data.status === "success") {
        setSummary(res.data);
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
    <DashboardLayout links={HOST_LINKS}>
      <h2>Host Dashboard</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
            <SummaryCard label="Total Properties" value={summary.total_properties} />
            <SummaryCard label="Total Bookings" value={summary.total_bookings} />
            <SummaryCard label="Revenue" value={`₹${summary.revenue}`} />
            <SummaryCard label="Average Rating" value={summary.average_rating > 0 ? `★ ${summary.average_rating}` : "No ratings yet"} />
          </div>

          <h3>Recent Bookings</h3>
          {summary.recent_bookings.length === 0 ? (
            <p style={{ color: "var(--color-text-light)" }}>No bookings yet.</p>
          ) : (
            summary.recent_bookings.map((b) => (
              <div key={b.booking_id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 12, marginBottom: 10 }}>
                <strong>{b.property_title}</strong>
                <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-light)" }}>
                  #{b.booking_number} · {b.customer_name} · {b.check_in} → {b.check_out} · ₹{b.total_amount} · {b.status}
                </p>
              </div>
            ))
          )}

          <Link to="/host/properties/add" className="btn btn-primary" style={{ maxWidth: 200, marginTop: 12 }}>
            + Add Property
          </Link>
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
