import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const CUSTOMER_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bookings", label: "My Bookings" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/my-reviews", label: "My Reviews" },
  { to: "/profile", label: "Profile" },
  { to: "/change-password", label: "Change Password" },
];

// Customer's landing dashboard: upcoming booking, most recent booking,
// wishlist count and completed stay count -- all real data from
// dashboard/customer.php, no hardcoded numbers.
export default function CustomerDashboard() {
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
      const res = await api.get("/dashboard/customer.php");
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
    <DashboardLayout links={CUSTOMER_LINKS}>
      <h2>Dashboard</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
            <SummaryCard label="Wishlist" value={summary.wishlist_count} />
            <SummaryCard label="Completed Stays" value={summary.completed_count} />
          </div>

          <h3>Upcoming Booking</h3>
          {summary.upcoming_booking ? (
            <BookingLine booking={summary.upcoming_booking} />
          ) : (
            <p style={{ color: "var(--color-text-light)" }}>No upcoming bookings.</p>
          )}

          <h3>Recent Booking</h3>
          {summary.recent_booking ? (
            <BookingLine booking={summary.recent_booking} showStatus />
          ) : (
            <p style={{ color: "var(--color-text-light)" }}>No bookings yet.</p>
          )}

          <Link to="/properties" className="btn btn-primary" style={{ maxWidth: 200, marginTop: 20 }}>
            Browse Properties
          </Link>
        </>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 16 }}>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--color-text-light)" }}>{label}</div>
    </div>
  );
}

function BookingLine({ booking, showStatus }) {
  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 12, marginBottom: 16 }}>
      <strong>{booking.property_title}</strong>
      <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-light)" }}>
        #{booking.booking_number} · {booking.check_in} → {booking.check_out}
        {showStatus && ` · ${booking.status}`}
      </p>
    </div>
  );
}
