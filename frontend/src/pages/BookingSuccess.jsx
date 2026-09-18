import { useLocation, useNavigate, Link } from "react-router-dom";

// Shown right after a successful booking + payment simulation.
// Reads the booking data passed via navigate(..., { state }) from
// PropertyDetails. If the page is reached directly (no state), it
// redirects back to My Bookings instead of showing a blank/broken page.
export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const { booking, propertyTitle } = location.state || {};

  if (!booking) {
    // No booking data means someone navigated here directly (e.g. refreshed).
    // Send them somewhere useful instead of showing an empty success screen.
    navigate("/bookings", { replace: true });
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-card success-screen">
        <div className="success-check">✓</div>
        <h2 style={{ margin: "0 0 4px" }}>Payment Successful</h2>
        <p style={{ color: "var(--color-text-light)", marginBottom: 20 }}>
          Booking Confirmed for {propertyTitle}
        </p>

        <div className="success-detail-row">
          <span>Booking Number</span>
          <strong>{booking.booking_number}</strong>
        </div>
        <div className="success-detail-row">
          <span>Transaction Number</span>
          <strong>{booking.transaction_number}</strong>
        </div>
        <div className="success-detail-row">
          <span>Nights</span>
          <strong>{booking.nights}</strong>
        </div>
        <div className="success-detail-row">
          <span>Total Paid</span>
          <strong>₹{booking.total_amount}</strong>
        </div>

        <Link to="/bookings" className="btn btn-primary" style={{ marginTop: 20 }}>
          View Booking
        </Link>
      </div>
    </div>
  );
}
