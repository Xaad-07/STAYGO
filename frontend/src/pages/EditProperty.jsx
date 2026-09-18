import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const AMENITIES = [
  { id: 1, name: "WiFi" },
  { id: 2, name: "Air Conditioning" },
  { id: 3, name: "Parking" },
  { id: 4, name: "Kitchen" },
  { id: 5, name: "TV" },
  { id: 6, name: "Washing Machine" },
  { id: 7, name: "Pool" },
  { id: 8, name: "Geyser" },
];

const PROPERTY_TYPES = ["Apartment", "Villa", "Hotel", "Resort", "Homestay", "Cottage", "Other"];

// Edit form for a host's existing property. Loads current data via
// details.php, then submits changes to update.php.
export default function EditProperty() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null); // null while loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  async function loadProperty() {
    setLoading(true);
    try {
      const res = await api.get("/property/details.php", { params: { property_id: propertyId } });
      if (res.data.status === "success") {
        const p = res.data.property;
        setForm({
          title: p.title,
          description: p.description || "",
          property_type: p.property_type,
          address: p.address,
          city: p.city,
          state: p.state,
          country: p.country,
          pincode: p.pincode,
          price: p.price_per_night,
          guests: p.guests,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          pickup_available: !!Number(p.pickup_available),
          amenity_ids: p.amenities.map((a) => a.amenity_id),
        });
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function toggleAmenity(amenityId) {
    setForm((prev) => {
      const already = prev.amenity_ids.includes(amenityId);
      return {
        ...prev,
        amenity_ids: already
          ? prev.amenity_ids.filter((id) => id !== amenityId)
          : [...prev.amenity_ids, amenityId],
      };
    });
  }

  function validate() {
    if (form.title.trim().length < 5) return "Title must be at least 5 characters long.";
    if (!PROPERTY_TYPES.includes(form.property_type)) return "Please select a property type.";
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.country.trim())
      return "Address, city, state and country are required.";
    if (!/^[0-9]{4,10}$/.test(String(form.pincode))) return "Please enter a valid PIN code.";
    if (!(Number(form.price) > 0)) return "Please enter a valid price per night.";
    if (!(Number(form.guests) >= 1)) return "Guests must be at least 1.";
    if (!(Number(form.bedrooms) >= 1)) return "Bedrooms must be at least 1.";
    if (!(Number(form.bathrooms) >= 1)) return "Bathrooms must be at least 1.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/property/update.php", {
        property_id: Number(propertyId),
        ...form,
      });

      if (res.data.status === "success") {
        setSuccess("Property updated successfully.");
        setTimeout(() => navigate("/host/properties"), 1000);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading property...</p>;
  }

  if (!form) {
    return (
      <div style={{ maxWidth: 640, margin: "40px auto" }}>
        <div className="alert alert-error">{error || "Property not found."}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      <h2>Edit Property</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" name="title" value={form.title} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" name="description" rows={4} value={form.description} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Property Type</label>
          <select className="form-input" name="property_type" value={form.property_type} onChange={handleChange}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" name="address" value={form.address} onChange={handleChange} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" name="city" value={form.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-input" name="state" value={form.state} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input className="form-input" name="country" value={form.country} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">PIN Code</label>
            <input className="form-input" name="pincode" value={form.pincode} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Price / night (₹)</label>
            <input className="form-input" type="number" min="1" name="price" value={form.price} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Guests</label>
            <input className="form-input" type="number" min="1" name="guests" value={form.guests} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Bedrooms</label>
            <input className="form-input" type="number" min="1" name="bedrooms" value={form.bedrooms} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Bathrooms</label>
            <input className="form-input" type="number" min="1" name="bathrooms" value={form.bathrooms} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              name="pickup_available"
              checked={form.pickup_available}
              onChange={handleChange}
              style={{ marginRight: 8 }}
            />
            Pickup/Drop assistance available
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Amenities</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AMENITIES.map((amenity) => (
              <div
                key={amenity.id}
                onClick={() => toggleAmenity(amenity.id)}
                className={`role-option ${form.amenity_ids.includes(amenity.id) ? "selected" : ""}`}
                style={{ flex: "0 0 auto", padding: "8px 14px" }}
              >
                {amenity.name}
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
