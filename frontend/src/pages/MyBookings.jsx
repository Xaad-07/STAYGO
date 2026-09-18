import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ReviewForm from "../components/ReviewForm";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='90'>
       <rect width='100%' height='100%' fill='#f0f0f0'/>
       <text x='50%' y='50%' font-family='sans-serif' font-size='10' fill='#999'
             text-anchor='middle' dominant-baseline='middle'>No image</text>
     </svg>`
  );
const BACKEND_BASE = "http://localhost/staygo/backend";

// Customer's booking history. Shows property, dates, guests, total and
// status, with a Cancel action (only shown for confirmed, upcoming bookings).
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null); // booking currently showing the review form
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]); // bookings that already have a review

  useEffect(() => {
    loadBookings();
    loadReviewedBookingIds();
  }, []);

  // Fetches which of the customer's bookings already have a review, so we
  // can hide the "Write a review" prompt for those and avoid a duplicate
  // submission (the backend also enforces this, this is just for UX).
  async function loadReviewedBookingIds() {
    try {
      const res = await api.get("/review/read.php", { params: { mine: 1 } });
      if (res.data.status === "success") {
        setReviewedBookingIds(res.data.reviews.map((r) => r.booking_id));
      }
    } catch (err) {
      // Non-critical -- if this fails, create.php's duplicate check still
      // protects the backend; the prompt might just show up unnecessarily.
    }
  }

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

  async function handleCancel(bookingId) {
    try {
      const res = await api.post("/booking/update.php", { booking_id: bookingId, action: "cancel" });
      if (res.data.status === "success") {
        setBookings((prev) =>
          prev.map((b) => (b.booking_id === bookingId ? { ...b, status: "cancelled" } : b))
        );
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>Loading your bookings...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <h2>My Bookings</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {bookings.length === 0 ? (
        <p>You don't have any bookings yet.</p>
      ) : (
        bookings.map((b) => (
          <div
            key={b.booking_id}
            style={{
              display: "flex",
              gap: 16,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: 14,
              marginBottom: 12,
            }}
          >
            <img
              src={b.property_image ? `${BACKEND_BASE}/uploads/properties/${b.property_image}` : FALLBACK_IMAGE}
              alt={b.property_title}
              style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 8 }}
              onError={(e) => (e.target.src = FALLBACK_IMAGE)}
            />
            <div style={{ flex: 1 }}>
              <strong>{b.property_title}</strong>
              <p style={{ margin: "2px 0", fontSize: 13, color: "var(--color-text-light)" }}>
                Booking #{b.booking_number}
              </p>
              <p style={{ margin: "2px 0", fontSize: 13 }}>
                {b.check_in} → {b.check_out} · {b.guests} guests
              </p>
              <p style={{ margin: "2px 0", fontSize: 13 }}>
                ₹{b.total_amount} ·{" "}
                <span
                  style={{
                    color:
                      b.status === "confirmed"
                        ? "var(--color-success)"
                        : b.status === "cancelled"
                        ? "var(--color-error)"
                        : "var(--color-text-light)",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {b.status}
                </span>
              </p>

              <Link to={`/bookings/${b.booking_id}`} className="btn-link" style={{ marginRight: 12 }}>
                View Details
              </Link>

              {b.status === "confirmed" && (
                <>
                  {cancellingId === b.booking_id ? (
                    <span>
                      <span style={{ fontSize: 13, marginRight: 6 }}>Cancel this booking?</span>
                      <button
                        className="btn-link"
                        style={{ color: "var(--color-error)", marginRight: 8 }}
                        onClick={() => handleCancel(b.booking_id)}
                      >
                        Yes, cancel
                      </button>
                      <button className="btn-link" onClick={() => setCancellingId(null)}>
                        Keep booking
                      </button>
                    </span>
                  ) : (
                    <button className="btn-link" style={{ color: "var(--color-error)" }} onClick={() => setCancellingId(b.booking_id)}>
                      Cancel Booking
                    </button>
                  )}
                </>
              )}

              {b.status === "completed" && !reviewedBookingIds.includes(b.booking_id) && (
                <>
                  {reviewingId === b.booking_id ? (
                    <ReviewForm
                      bookingId={b.booking_id}
                      onSubmitted={() => {
                        setReviewedBookingIds((prev) => [...prev, b.booking_id]);
                        setReviewingId(null);
                      }}
                    />
                  ) : (
                    <button className="btn-link" onClick={() => setReviewingId(b.booking_id)}>
                      Write a review
                    </button>
                  )}
                </>
              )}

              {b.status === "completed" && reviewedBookingIds.includes(b.booking_id) && (
                <span style={{ fontSize: 13, color: "var(--color-text-light)" }}>Review submitted ✓</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
