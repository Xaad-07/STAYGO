import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import PaymentDrawer from "../components/PaymentDrawer";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260'>
       <rect width='100%' height='100%' fill='#f0f0f0'/>
       <text x='50%' y='50%' font-family='sans-serif' font-size='16' fill='#999'
             text-anchor='middle' dominant-baseline='middle'>No image available</text>
     </svg>`
  );
const BACKEND_BASE = "http://localhost/staygo/backend";

// Full Property Details page: image gallery with fullscreen viewer,
// property info, amenities, reviews, and a booking card that calculates
// the price live and opens the payment simulation drawer.
export default function PropertyDetails() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewerImage, setViewerImage] = useState(null); // fullscreen image viewer

  // -------------------- BOOKING FORM STATE --------------------
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [pickupRequired, setPickupRequired] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [propertyId]);

  async function loadDetails() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/property/details.php", { params: { property_id: propertyId } });
      if (res.data.status === "success") {
        setProperty(res.data.property);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>Loading property...</p>;
  if (error) return <div className="alert alert-error" style={{ maxWidth: 500, margin: "40px auto" }}>{error}</div>;
  if (!property) return null;

  const images = property.images.length > 0
    ? property.images.map((img) => `${BACKEND_BASE}/uploads/properties/${img.image_path}`)
    : [FALLBACK_IMAGE];

  // -------------------- LIVE PRICE CALCULATION (frontend preview only) --------------------
  // The backend recalculates and is the real source of truth; this is just
  // for showing the customer a live total before they pay.
  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;
  const pricePerNight = Number(property.price_per_night);
  const subtotal = nights * pricePerNight;
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const pickupCharge = pickupRequired ? 300 : 0;
  const totalAmount = Math.round((subtotal + taxAmount + pickupCharge) * 100) / 100;

  const todayStr = new Date().toISOString().split("T")[0];

  function validateBookingForm() {
    if (!user) return "Please log in to book this property.";
    if (user.role !== "customer") return "Only customer accounts can make bookings.";
    if (!checkIn || !checkOut) return "Please select check-in and check-out dates.";
    if (new Date(checkIn) < new Date(todayStr)) return "Check-in date cannot be in the past.";
    if (new Date(checkOut) <= new Date(checkIn)) return "Check-out date must be after check-in date.";
    if (guests < 1) return "Please select at least 1 guest.";
    if (guests > property.guests) return `This property allows a maximum of ${property.guests} guests.`;
    if (pickupRequired && (!pickupLocation || !pickupDate || !pickupTime)) {
      return "Please complete all pickup details.";
    }
    return "";
  }

  function handleReserveClick() {
    setBookingError("");
    const validationError = validateBookingForm();
    if (validationError) {
      if (!user) {
        // Send them to login rather than just showing an error with nowhere to go.
        navigate("/login");
        return;
      }
      setBookingError(validationError);
      return;
    }
    setShowDrawer(true);
  }

  async function handlePaymentConfirm(paymentMethod) {
    setSubmittingBooking(true);
    try {
      const res = await api.post("/booking/create.php", {
        property_id: Number(propertyId),
        check_in: checkIn,
        check_out: checkOut,
        guests,
        payment_method: paymentMethod,
        pickup_required: pickupRequired,
        pickup_location: pickupLocation,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        pickup_instructions: pickupInstructions,
      });

      if (res.data.status === "success") {
        // Send the customer to a success screen with the real booking info.
        navigate("/booking-success", { state: { booking: res.data, propertyTitle: property.title } });
      } else {
        setShowDrawer(false);
        setBookingError(res.data.message);
      }
    } catch (err) {
      setShowDrawer(false);
      setBookingError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmittingBooking(false);
    }
  }

  return (
    <div className="details-page">
      <Link to="/properties" className="btn-link">← Back to Properties</Link>

      <h2 style={{ marginTop: 12, marginBottom: 4 }}>{property.title}</h2>
      <p style={{ color: "var(--color-text-light)", margin: "0 0 16px" }}>
        {property.city}, {property.state}, {property.country} · ★{" "}
        {Number(property.rating) > 0 ? property.rating : "New"} · {property.review_count} reviews
      </p>

      {/* -------------------- IMAGE GALLERY -------------------- */}
      <div className="gallery-grid">
        <div className="gallery-main" onClick={() => setViewerImage(images[0])}>
          <img src={images[0]} alt={property.title} onError={(e) => (e.target.src = FALLBACK_IMAGE)} />
        </div>
        <div className="gallery-thumbs">
          {[1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={images[i] || images[0]}
              alt={`${property.title} ${i}`}
              onClick={() => setViewerImage(images[i] || images[0])}
              onError={(e) => (e.target.src = FALLBACK_IMAGE)}
            />
          ))}
        </div>
      </div>

      {viewerImage && (
        <div className="gallery-viewer-overlay" onClick={() => setViewerImage(null)}>
          <button className="gallery-viewer-close" onClick={() => setViewerImage(null)}>×</button>
          <img src={viewerImage} alt="Full view" />
        </div>
      )}

      <div className="details-layout">
        {/* -------------------- LEFT: PROPERTY INFO -------------------- */}
        <div className="details-main">
          <h3>About this property</h3>
          <p>{property.description}</p>

          <div style={{ display: "flex", gap: 20, margin: "16px 0", fontSize: 14 }}>
            <span>{property.property_type}</span>
            <span>{property.guests} guests</span>
            <span>{property.bedrooms} bedrooms</span>
            <span>{property.bathrooms} bathrooms</span>
          </div>

          {property.amenities.length > 0 && (
            <>
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {property.amenities.map((a) => (
                  <div key={a.amenity_id} className="amenity-chip">{a.amenity_name}</div>
                ))}
              </div>
            </>
          )}

          <h3>Hosted by {property.host_name}</h3>

          <h3>Reviews ({property.review_count})</h3>
          {property.reviews.length === 0 ? (
            <p style={{ color: "var(--color-text-light)" }}>No reviews yet.</p>
          ) : (
            property.reviews.map((r, idx) => (
              <div key={idx} className="review-item">
                <strong>{r.customer_name}</strong> · ★ {r.rating}
                <p style={{ margin: "4px 0 0" }}>{r.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* -------------------- RIGHT: BOOKING CARD -------------------- */}
        <div className="booking-card">
          <div className="booking-card-price">
            ₹{property.price_per_night} <span className="booking-card-price-unit">/ night</span>
          </div>

          {bookingError && <div className="alert alert-error" style={{ marginTop: 12 }}>{bookingError}</div>}

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Check-in</label>
            <input className="form-input" type="date" min={todayStr} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Check-out</label>
            <input className="form-input" type="date" min={checkIn || todayStr} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Guests</label>
            <div className="guest-stepper">
              <button className="stepper-btn" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}>−</button>
              <span>{guests}</span>
              <button className="stepper-btn" onClick={() => setGuests(Math.min(property.guests, guests + 1))} disabled={guests >= property.guests}>+</button>
            </div>
            <div className="field-hint">Max {property.guests} guests</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <input type="checkbox" checked={pickupRequired} onChange={(e) => setPickupRequired(e.target.checked)} style={{ marginRight: 8 }} />
              Need Pickup?
            </label>
          </div>

          {pickupRequired && (
            <>
              <div className="form-group">
                <label className="form-label">Pickup Location</label>
                <input className="form-input" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="e.g. City Airport" />
              </div>
              <div className="form-group">
                <label className="form-label">Pickup Date</label>
                <input className="form-input" type="date" min={todayStr} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Pickup Time</label>
                <input className="form-input" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea className="form-input" rows={2} value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} />
              </div>
            </>
          )}

          {nights > 0 && (
            <div style={{ margin: "12px 0" }}>
              <div className="price-breakdown-row"><span>₹{pricePerNight} × {nights} nights</span><span>₹{subtotal}</span></div>
              <div className="price-breakdown-row"><span>Taxes</span><span>₹{taxAmount}</span></div>
              {pickupRequired && <div className="price-breakdown-row"><span>Pickup charge</span><span>₹{pickupCharge}</span></div>}
              <div className="price-breakdown-total"><span>Total</span><span>₹{totalAmount}</span></div>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleReserveClick} style={{ marginTop: 8 }}>
            Reserve
          </button>
        </div>
      </div>

      {showDrawer && (
        <PaymentDrawer
          totalAmount={totalAmount}
          onClose={() => setShowDrawer(false)}
          onConfirm={handlePaymentConfirm}
          submitting={submittingBooking}
        />
      )}
    </div>
  );
}
