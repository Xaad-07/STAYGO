import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";
import Footer from "../components/Footer";

const CATEGORIES = ["Apartment", "Villa", "Hotel", "Resort", "Homestay", "Cottage"];

// The real StayGo Home page: hero with search, categories, featured
// properties pulled live from the database, a short "why choose us"
// section, and a closing CTA. No hardcoded property data anywhere --
// featured properties come from property/read.php like every other list.
export default function Home() {
  const navigate = useNavigate();

  // -------------------- MAIN SEARCH STATE --------------------
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // -------------------- ADVANCED FILTERS STATE --------------------
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [pets, setPets] = useState(0);
  const [pickupOnly, setPickupOnly] = useState(false);

  // -------------------- LIVE RESULTS SHOWN BELOW THE SEARCH --------------------
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [searching, setSearching] = useState(false);

  // -------------------- FEATURED PROPERTIES --------------------
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    setLoadingFeatured(true);
    try {
      const res = await api.get("/property/read.php", { params: { sort: "recommended" } });
      if (res.data.status === "success") {
        setFeatured(res.data.properties.slice(0, 4));
      }
    } catch (err) {
      // Featured properties failing to load isn't critical -- the rest of
      // the page still works, so we just show an empty section quietly.
    } finally {
      setLoadingFeatured(false);
    }
  }

  // Builds the same filter object the Properties page would read from the URL.
  function buildSearchParams() {
    const params = {};
    if (destination) params.city = destination;
    const totalGuests = adults + children;
    if (totalGuests > 0) params.guests = totalGuests;
    if (propertyType) params.property_type = propertyType;
    if (maxPrice) params.max_price = maxPrice;
    if (pickupOnly) params.pickup_only = "1";
    return params;
  }

  // Runs the search right here on Home and shows results below the search
  // bar, instead of redirecting to an empty Properties page (spec requirement).
  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await api.get("/property/read.php", { params: buildSearchParams() });
      if (res.data.status === "success") {
        setSearchResults(res.data.properties);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  // Lets the customer continue to the full Properties page with these
  // same filters preserved, if they want more filtering/sorting options.
  function viewAllOnPropertiesPage() {
    const params = buildSearchParams();
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    navigate(`/properties${query ? `?${query}` : ""}`);
  }

  function handleCategoryClick(category) {
    navigate(`/properties?property_type=${encodeURIComponent(category)}`);
  }

  return (
    <div>
      {/* -------------------- HERO + SEARCH -------------------- */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1>Find your perfect stay.</h1>
            <p>Explore comfortable places for your next journey.</p>
          </div>
          <div className="hero-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80"
              alt="A comfortable place to stay"
              className="hero-image"
            />
          </div>
        </div>

        <form className="search-card" onSubmit={handleSearch}>
          <div className="search-fields">
            <div className="search-field">
              <label className="form-label">Destination</label>
              <input
                className="form-input"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where are you going?"
              />
            </div>
            <div className="search-field">
              <label className="form-label">Check-in</label>
              <input
                className="form-input"
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label className="form-label">Check-out</label>
              <input
                className="form-input"
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label className="form-label">Guests</label>
              <div className="guest-stepper">
                <button type="button" className="stepper-btn" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>−</button>
                <span>{adults + children} guests</span>
                <button type="button" className="stepper-btn" onClick={() => setAdults(adults + 1)}>+</button>
              </div>
            </div>
            <button className="btn btn-primary search-btn" type="submit" disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          <button type="button" className="btn-link" onClick={() => setShowAdvanced(!showAdvanced)} style={{ marginTop: 10 }}>
            {showAdvanced ? "Hide advanced filters" : "Advanced Filters"}
          </button>

          {showAdvanced && (
            <div className="advanced-filters">
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select className="form-input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="">Any type</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Price: ₹{maxPrice}</label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adults</label>
                <div className="guest-stepper">
                  <button type="button" className="stepper-btn" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>−</button>
                  <span>{adults}</span>
                  <button type="button" className="stepper-btn" onClick={() => setAdults(adults + 1)}>+</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Children</label>
                <div className="guest-stepper">
                  <button type="button" className="stepper-btn" onClick={() => setChildren(Math.max(0, children - 1))} disabled={children <= 0}>−</button>
                  <span>{children}</span>
                  <button type="button" className="stepper-btn" onClick={() => setChildren(children + 1)}>+</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pets</label>
                <div className="guest-stepper">
                  <button type="button" className="stepper-btn" onClick={() => setPets(Math.max(0, pets - 1))} disabled={pets <= 0}>−</button>
                  <span>{pets}</span>
                  <button type="button" className="stepper-btn" onClick={() => setPets(pets + 1)}>+</button>
                </div>
                {pets > 0 && (
                  <div className="field-hint">Mention pets in special instructions when booking; not all properties may accommodate them.</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={pickupOnly} onChange={(e) => setPickupOnly(e.target.checked)} style={{ marginRight: 8 }} />
                  Pickup availability required
                </label>
              </div>
            </div>
          )}
        </form>
      </section>

      {/* -------------------- LIVE SEARCH RESULTS -------------------- */}
      {searchResults !== null && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>{searching ? "Searching..." : `${searchResults.length} propert${searchResults.length === 1 ? "y" : "ies"} found`}</h2>
            {searchResults.length > 0 && (
              <button className="btn-link" onClick={viewAllOnPropertiesPage}>See all on Properties page</button>
            )}
          </div>
          {!searching && searchResults.length === 0 ? (
            <p className="empty-state">No properties matched your search. Try different dates or filters.</p>
          ) : (
            <div className="properties-grid">
              {searchResults.map((p) => (
                <PropertyCard key={p.property_id} property={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* -------------------- CATEGORIES -------------------- */}
      <section className="home-section">
        <h2>Browse by category</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <button key={c} className="category-card" onClick={() => handleCategoryClick(c)}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* -------------------- FEATURED PROPERTIES -------------------- */}
      <section className="home-section">
        <h2>Featured properties</h2>
        {loadingFeatured ? (
          <p>Loading...</p>
        ) : featured.length === 0 ? (
          <p className="empty-state">No properties available yet.</p>
        ) : (
          <div className="properties-grid">
            {featured.map((p) => (
              <PropertyCard key={p.property_id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* -------------------- WHY CHOOSE STAYGO -------------------- */}
      <section className="home-section">
        <h2>Why Choose StayGo</h2>
        <div className="why-grid">
          <div className="why-card">
            <h3>Easy Booking</h3>
            <p>Search, compare and reserve a stay in just a few steps.</p>
          </div>
          <div className="why-card">
            <h3>Verified Information</h3>
            <p>Property details, pricing and availability come straight from our database.</p>
          </div>
          <div className="why-card">
            <h3>Flexible Pickup</h3>
            <p>Add pickup and drop assistance to your booking when you need it.</p>
          </div>
          <div className="why-card">
            <h3>Secure Accounts</h3>
            <p>Your account is protected with modern password security.</p>
          </div>
        </div>
      </section>

      {/* -------------------- CTA -------------------- */}
      <section className="home-cta">
        <h2>Ready to find your next stay?</h2>
        <Link to="/properties" className="btn btn-primary" style={{ maxWidth: 220, margin: "16px auto 0" }}>
          Explore Properties
        </Link>
      </section>

      <Footer />
    </div>
  );
}
