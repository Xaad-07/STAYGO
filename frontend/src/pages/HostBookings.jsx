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

// Lists every booking made on any of the host's properties.
// booking/read.php already returns the right rows based on the
// logged-in host's session (role-aware endpoint).
export default function HostBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/booking/read.php");
      if (res.data.status === "success") {
        setBookings(res.data.bookings);
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
      <h2>Bookings</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>Booking #</th>
              <th style={{ padding: 10 }}>Customer</th>
              <th style={{ padding: 10 }}>Property</th>
              <th style={{ padding: 10 }}>Dates</th>
              <th style={{ padding: 10 }}>Guests</th>
              <th style={{ padding: 10 }}>Amount</th>
              <th style={{ padding: 10 }}>Pickup</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.booking_id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: 10 }}>{b.booking_number}</td>
                <td style={{ padding: 10 }}>{b.customer_name}</td>
                <td style={{ padding: 10 }}>{b.property_title}</td>
                <td style={{ padding: 10 }}>{b.check_in} → {b.check_out}</td>
                <td style={{ padding: 10 }}>{b.guests}</td>
                <td style={{ padding: 10 }}>₹{b.total_amount}</td>
                <td style={{ padding: 10 }}>{Number(b.pickup_required) === 1 ? "Yes" : "No"}</td>
                <td style={{ padding: 10, textTransform: "capitalize" }}>{b.status}</td>
                <td style={{ padding: 10 }}>
                  <Link to={`/bookings/${b.booking_id}`} className="btn-link">View Details</Link>
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
