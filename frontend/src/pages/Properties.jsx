import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";

const PROPERTY_TYPES = ["Apartment", "Villa", "Hotel", "Resort", "Homestay", "Cottage", "Other"];

// Public Properties page. Filters are stored in the URL's query string
// (via useSearchParams) so that:
//   1. The Home page search can link here with values pre-filled.
//   2. Results are shareable/bookmarkable and survive a page refresh.
// Every result comes from read.php -- there are no hardcoded arrays.
export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Local copies of filter values, initialized from the URL so a shared
  // link or a Home-page search shows the right filters immediately.
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [propertyType, setPropertyType] = useState(searchParams.get("property_type") || "");
  const [guests, setGuests] = useState(searchParams.get("guests") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [pickupOnly, setPickupOnly] = useState(searchParams.get("pickup_only") === "1");
  const [sort, setSort] = useState(searchParams.get("sort") || "recommended");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Re-fetch every time the URL's query params change. This keeps the
  // "current filters" and "what was actually searched" in sync.
  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  async function fetchProperties() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchParams.get("city")) params.city = searchParams.get("city");
      if (searchParams.get("property_type")) params.property_type = searchParams.get("property_type");
      if (searchParams.get("guests")) params.guests = searchParams.get("guests");
      if (searchParams.get("max_price")) params.max_price = searchParams.get("max_price");
      if (searchParams.get("pickup_only") === "1") params.pickup_only = "1";
      params.sort = searchParams.get("sort") || "recommended";

      const res = await api.get("/property/read.php", { params });
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

  // Pushes the current filter panel values into the URL, which triggers
  // the useEffect above to re-fetch.
  function applyFilters() {
    const next = {};
    if (city) next.city = city;
    if (propertyType) next.property_type = propertyType;
    if (guests) next.guests = guests;
    if (maxPrice) next.max_price = maxPrice;
    if (pickupOnly) next.pickup_only = "1";
    if (sort !== "recommended") next.sort = sort;
    setSearchParams(next);
    setShowMobileFilters(false);
  }

  function clearFilters() {
    setCity("");
    setPropertyType("");
    setGuests("");
    setMaxPrice("");
    setPickupOnly(false);
    setSort("recommended");
    setSearchParams({});
  }

  function handleSortChange(newSort) {
    setSort(newSort);
    const next = Object.fromEntries(searchParams.entries());
    if (newSort === "recommended") {
      delete next.sort;
    } else {
      next.sort = newSort;
    }
    setSearchParams(next);
  }

  return (
    <div>
      {/* Mobile-only Filters/Sort bar. On desktop this is hidden by CSS
          and the sidebar shows inline instead (see .filters-mobile-bar). */}
      <div className="filters-mobile-bar">
        <button className="filters-mobile-btn" onClick={() => setShowMobileFilters(true)}>
          Filters
        </button>
        <select
          className="form-input"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="recommended">Sort: Recommended</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      <div className="properties-page">
        {/* Desktop sidebar. Also reused inside the mobile drawer below via
            the same JSX so the filter fields never fall out of sync. */}
        <aside className="filters-sidebar filters-sidebar-desktop">
          <FilterPanel
            city={city} setCity={setCity}
            propertyType={propertyType} setPropertyType={setPropertyType}
            guests={guests} setGuests={setGuests}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            pickupOnly={pickupOnly} setPickupOnly={setPickupOnly}
            onApply={applyFilters}
            onClear={clearFilters}
          />
        </aside>

        {showMobileFilters && (
          <div className="drawer-overlay" onClick={() => setShowMobileFilters(false)}>
            <div className="filters-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h3 style={{ margin: 0 }}>Filters</h3>
                <button className="drawer-close" onClick={() => setShowMobileFilters(false)}>×</button>
              </div>
              <FilterPanel
                city={city} setCity={setCity}
                propertyType={propertyType} setPropertyType={setPropertyType}
                guests={guests} setGuests={setGuests}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                pickupOnly={pickupOnly} setPickupOnly={setPickupOnly}
                onApply={applyFilters}
                onClear={clearFilters}
              />
            </div>
          </div>
        )}

        <main className="properties-results">
          <div className="properties-toolbar">
            <span className="properties-count">
              {loading ? "Searching..." : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} found`}
            </span>
            <select
              className="form-input properties-sort-desktop"
              style={{ width: 200 }}
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="empty-state">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              No properties found. Try adjusting your filters.
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Extracted so the exact same filter fields render both in the desktop
// sidebar and inside the mobile drawer without duplicating markup.
function FilterPanel({ city, setCity, propertyType, setPropertyType, guests, setGuests, maxPrice, setMaxPrice, pickupOnly, setPickupOnly, onApply, onClear }) {
  return (
    <div className="filters-card">
      <div className="filters-title">Filters</div>

      <div className="form-group">
        <label className="form-label">Destination</label>
        <input
          className="form-input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Property Type</label>
        <select className="form-input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Guests</label>
        <input
          className="form-input"
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Any"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Max Price / night (₹)</label>
        <input
          className="form-input"
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Any"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          <input
            type="checkbox"
            checked={pickupOnly}
            onChange={(e) => setPickupOnly(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Pickup available only
        </label>
      </div>

      <button className="btn btn-primary" onClick={onApply} style={{ marginBottom: 8 }}>
        Apply Filters
      </button>
      <button className="btn-link" onClick={onClear}>
        Clear all filters
      </button>
    </div>
  );
}
