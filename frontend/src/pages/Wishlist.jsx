import { useEffect, useState } from "react";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";

// Shows the customer's wishlisted properties as cards. Every card here
// starts with its heart already filled (initiallyWishlisted=true) since,
// by definition, everything on this page is currently wishlisted.
// Un-hearting a card here removes it from the list immediately.
export default function Wishlist() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWishlist();
  }, []);

  async function loadWishlist() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/wishlist/read.php");
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

  function handleWishlistChange(propertyId, isWishlisted) {
    // If the user un-hearts a property on this page, it should disappear
    // from the wishlist view immediately rather than waiting for a reload.
    if (!isWishlisted) {
      setProperties((prev) => prev.filter((p) => p.property_id !== propertyId));
    }
  }

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>Loading your wishlist...</p>;

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 20px" }}>
      <h2>My Wishlist</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {properties.length === 0 ? (
        <p>Your wishlist is empty. Browse properties and tap the heart to save your favorites.</p>
      ) : (
        <div className="properties-grid">
          {properties.map((property) => (
            <PropertyCard
              key={property.property_id}
              property={property}
              initiallyWishlisted={true}
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
