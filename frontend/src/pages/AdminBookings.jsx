import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/bookings.php")
      .then((res) => {
        if (res.data.status === "success") setBookings(res.data.bookings);
        else setError(res.data.message);
      })
      .catch(() => setError("Unable to connect to the server. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Bookings</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-scroll-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: 10 }}>Booking #</th>
              <th style={{ padding: 10 }}>Customer</th>
              <th style={{ padding: 10 }}>Property</th>
              <th style={{ padding: 10 }}>Dates</th>
              <th style={{ padding: 10 }}>Amount</th>
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
                <td style={{ padding: 10 }}>₹{b.total_amount}</td>
                <td style={{ padding: 10, textTransform: "capitalize" }}>{b.status}</td>
                <td style={{ padding: 10 }}>
                  <Link to={`/bookings/${b.booking_id}`} className="btn-link">View</Link>
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
