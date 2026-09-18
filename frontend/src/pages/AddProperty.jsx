import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

// List of amenities matches the seed data in staygo.sql (amenity_id 1-8).
// In a later pass this could be fetched from the backend instead of hardcoded,
// but for a project this size a fixed list keeps things simple.
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

// Form for a host to add a new property. On success, the property is created
// first (create.php), then any selected images are uploaded separately
// (upload_images.php) using the new property_id.
export default function AddProperty() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    property_type: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    price: "",
    guests: "",
    bedrooms: "",
    bathrooms: "",
    pickup_available: false,
    amenity_ids: [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  function handleFileChange(e) {
    // Keep at most 8 files, matching the backend's max-images-per-property rule.
    const files = Array.from(e.target.files).slice(0, 8);
    setImageFiles(files);
  }

  // -------------------- FRONTEND VALIDATION --------------------
  // Mirrors the backend rules in create.php, but the backend is the real
  // source of truth -- this just gives the host quick feedback.
  function validate() {
    if (form.title.trim().length < 5) return "Title must be at least 5 characters long.";
    if (!PROPERTY_TYPES.includes(form.property_type)) return "Please select a property type.";
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.country.trim())
      return "Address, city, state and country are required.";
    if (!/^[0-9]{4,10}$/.test(form.pincode)) return "Please enter a valid PIN code.";
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
      // Step 1: create the property record.
      const createRes = await api.post("/property/create.php", form);

      if (createRes.data.status !== "success") {
        setError(createRes.data.message);
        setSubmitting(false);
        return;
      }

      const propertyId = createRes.data.property_id;

      // Step 2: upload images, if any were selected. This uses multipart/form-data
      // since we are sending files, not JSON.
      if (imageFiles.length > 0) {
        const formData = new FormData();
        formData.append("property_id", propertyId);
        imageFiles.forEach((file) => formData.append("images[]", file));

        const uploadRes = await api.post("/property/upload_images.php", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.data.status !== "success") {
          // The property itself was created successfully; only the images failed.
          setError(`Property created, but image upload failed: ${uploadRes.data.message}`);
          setSubmitting(false);
          return;
        }
      }

      setSuccess("Property added successfully.");
      setTimeout(() => navigate("/host/properties"), 1200);
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      <h2>Add Property</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Cozy Beachside Villa" />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the property..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Property Type</label>
          <select className="form-input" name="property_type" value={form.property_type} onChange={handleChange}>
            <option value="">Select type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Street address" />
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

        <div className="form-group">
          <label className="form-label">Images (JPEG, PNG or WEBP, up to 8, max 5MB each)</label>
          <input
            className="form-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
          />
          {imageFiles.length > 0 && (
            <div className="field-hint success">{imageFiles.length} image(s) selected</div>
          )}
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Add Property"}
        </button>
      </form>
    </div>
  );
}
