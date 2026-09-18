import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

// Full detail view for a single booking, reachable from My Bookings /
// Host Bookings. Authorization (owning customer, owning host, or admin)
// is enforced server-side by booking/details.php.
export default function BookingDetails() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  async function loadBooking() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/booking/details.php", { params: { booking_id: bookingId } });
      if (res.data.status === "success") {
        setBooking(res.data.booking);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>Loading booking...</p>;
  if (error) return <div className="alert alert-error" style={{ maxWidth: 500, margin: "40px auto" }}>{error}</div>;
  if (!booking) return null;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 20px" }}>
      <Link to="/bookings" className="btn-link">← Back to Bookings</Link>

      <h2 style={{ marginTop: 12 }}>{booking.property_title}</h2>
      <p style={{ color: "var(--color-text-light)" }}>
        {booking.address}, {booking.city}, {booking.state}
      </p>

      <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 16, marginTop: 16 }}>
        <div className="success-detail-row"><span>Booking Number</span><strong>{booking.booking_number}</strong></div>
        <div className="success-detail-row"><span>Status</span><strong style={{ textTransform: "capitalize" }}>{booking.status}</strong></div>
        <div className="success-detail-row"><span>Check-in</span><strong>{booking.check_in}</strong></div>
        <div className="success-detail-row"><span>Check-out</span><strong>{booking.check_out}</strong></div>
        <div className="success-detail-row"><span>Guests</span><strong>{booking.guests}</strong></div>
        <div className="success-detail-row"><span>Nights</span><strong>{booking.nights}</strong></div>
        <div className="success-detail-row"><span>Subtotal</span><strong>₹{booking.subtotal}</strong></div>
        <div className="success-detail-row"><span>Taxes</span><strong>₹{booking.tax_amount}</strong></div>
        {Number(booking.pickup_required) === 1 && (
          <div className="success-detail-row"><span>Pickup Charge</span><strong>₹{booking.pickup_charge}</strong></div>
        )}
        <div className="success-detail-row"><span>Total Paid</span><strong>₹{booking.total_amount}</strong></div>
        <div className="success-detail-row"><span>Payment Method</span><strong>{booking.payment_method}</strong></div>
        <div className="success-detail-row"><span>Transaction Number</span><strong>{booking.transaction_number}</strong></div>
      </div>

      {Number(booking.pickup_required) === 1 && (
        <div style={{ marginTop: 20 }}>
          <h3>Pickup Details</h3>
          <p>Location: {booking.pickup_location}</p>
          <p>Date: {booking.pickup_date} · Preferred time: {booking.pickup_time}</p>
          {booking.pickup_instructions && <p>Instructions: {booking.pickup_instructions}</p>}
          {booking.driver_name ? (
            <>
              <p>Driver: {booking.driver_name} · {booking.driver_phone}</p>
              <p>Vehicle: {booking.vehicle_number}</p>
              {booking.final_pickup_time && <p>Confirmed pickup time: {booking.final_pickup_time}</p>}
            </>
          ) : (
            <p style={{ color: "var(--color-text-light)" }}>Pickup details will be assigned by the host soon.</p>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Host Contact</h3>
        <p>{booking.host_name} · {booking.host_phone}</p>
      </div>
    </div>
  );
}
