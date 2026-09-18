import { Link } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// A fallback image shown whenever a property has no uploaded photos yet,
// so we never show a broken image icon (spec requirement).
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

// Renders one property as a card: image, badges, title, location, quick stats,
// price and a "View Details" link. Used by both the Home page and Properties page
// so the visual style stays consistent everywhere.
//
// `initiallyWishlisted` lets a parent page (e.g. Wishlist.jsx) tell the card
// to start with the heart already filled, since that page only shows
// wishlisted properties in the first place.
export default function PropertyCard({ property, initiallyWishlisted = false, onWishlistChange }) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(initiallyWishlisted);
  const [toggling, setToggling] = useState(false);

  const imageUrl = property.primary_image
    ? `${BACKEND_BASE}/uploads/properties/${property.primary_image}`
    : FALLBACK_IMAGE;

  async function handleHeartClick(e) {
    // Stop the click from also triggering the card's Link navigation.
    e.preventDefault();
    e.stopPropagation();

    // Only customers have a wishlist; hosts/admins/guests just get sent to login.
    if (!user || user.role !== "customer" || toggling) return;

    setToggling(true);
    try {
      const res = await api.post("/wishlist/toggle.php", { property_id: property.property_id });
      if (res.data.status === "success") {
        setWishlisted(res.data.wishlisted);
        if (onWishlistChange) onWishlistChange(property.property_id, res.data.wishlisted);
      }
    } catch (err) {
      // Silently ignore -- the heart just won't change state, which is a safe failure mode.
    } finally {
      setToggling(false);
    }
  }

  return (
    <Link to={`/properties/${property.property_id}`} className="property-card">
      <div className="property-card-image-wrap">
        <img
          src={imageUrl}
          alt={property.title}
          className="property-card-image"
          onError={(e) => {
            // If the real file is missing on disk for any reason, fall back
            // gracefully instead of showing a broken image icon.
            e.target.src = FALLBACK_IMAGE;
          }}
        />
        {user && user.role === "customer" && (
          <button
            className="wishlist-heart"
            onClick={handleHeartClick}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        )}
        {Number(property.pickup_available) === 1 && (
          <span className="badge badge-pickup">Pickup Available</span>
        )}
        <span className="badge badge-rating">
          ★ {property.rating && Number(property.rating) > 0 ? property.rating : "New"}
        </span>
      </div>

      <div className="property-card-body">
        <h3 className="property-card-title">{property.title}</h3>
        <p className="property-card-location">
          {property.city}, {property.state}
        </p>
        <p className="property-card-meta">
          {property.guests} guests · {property.bedrooms} bed · {property.bathrooms} bath
        </p>
        <div className="property-card-footer">
          <span className="property-card-price">₹{property.price_per_night}</span>
          <span className="property-card-price-unit"> / night</span>
        </div>
      </div>
    </Link>
  );
}
