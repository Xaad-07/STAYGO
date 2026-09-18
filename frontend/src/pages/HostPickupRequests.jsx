import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const HOST_LINKS = [
  { to: "/host/dashboard", label: "Dashboard" },
  { to: "/host/properties", label: "My Properties" },
  { to: "/host/bookings", label: "Bookings" },
  { to: "/host/pickup-requests", label: "Pickup Requests" },
  { to: "/host/reviews", label: "Reviews" },
  { to: "/profile", label: "Profile" },
  { to: "/change-password", label: "Change Password" },
];

// Shows only the bookings that requested pickup assistance, and lets
// the host fill in driver name/phone, vehicle number, pickup charge
// and final pickup time via booking/update.php's "update_pickup" action.
export default function HostPickupRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/booking/read.php");
      if (res.data.status === "success") {
        // Only pickup-required bookings belong on this screen.
        setBookings(res.data.bookings.filter((b) => Number(b.pickup_required) === 1));
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(b) {
    setEditingId(b.booking_id);
    setForm({
      driver_name: b.driver_name || "",
      driver_phone: b.driver_phone || "",
      vehicle_number: b.vehicle_number || "",
      pickup_charge: b.pickup_charge || 0,
      final_pickup_time: b.final_pickup_time || "",
    });
  }

  async function handleSave(bookingId) {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/booking/update.php", {
        booking_id: bookingId,
        action: "update_pickup",
        ...form,
      });
      if (res.data.status === "success") {
        setBookings((prev) =>
          prev.map((b) => (b.booking_id === bookingId ? { ...b, ...form } : b))
        );
        setEditingId(null);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout links={HOST_LINKS}>
      <h2>Pickup Requests</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p>No pickup requests at the moment.</p>
      ) : (
        bookings.map((b) => (
          <div key={b.booking_id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: 14, marginBottom: 12 }}>
            <strong>{b.customer_name}</strong> · {b.property_title}
            <p style={{ margin: "4px 0", fontSize: 13, color: "var(--color-text-light)" }}>
              Pickup: {b.pickup_location} · {b.pickup_date} · {b.pickup_time}
            </p>
            {b.pickup_instructions && (
              <p style={{ margin: "4px 0", fontSize: 13 }}>Note: {b.pickup_instructions}</p>
            )}

            {editingId === b.booking_id ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Driver Name</label>
                    <input className="form-input" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driver Phone</label>
                    <input className="form-input" value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Number</label>
                    <input className="form-input" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pickup Charge (₹)</label>
                    <input className="form-input" type="number" min="0" value={form.pickup_charge} onChange={(e) => setForm({ ...form, pickup_charge: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Final Pickup Time</label>
                    <input className="form-input" value={form.final_pickup_time} onChange={(e) => setForm({ ...form, final_pickup_time: e.target.value })} placeholder="e.g. 10:15 AM" />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ maxWidth: 140 }} onClick={() => handleSave(b.booking_id)} disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </button>
                <button className="btn-link" style={{ marginLeft: 10 }} onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <p style={{ margin: "6px 0", fontSize: 13 }}>
                  Driver: {b.driver_name || "Not assigned"} {b.driver_phone && `· ${b.driver_phone}`}
                  {b.vehicle_number && ` · ${b.vehicle_number}`}
                  {Number(b.pickup_charge) > 0 && ` · ₹${b.pickup_charge}`}
                </p>
                <button className="btn-link" onClick={() => startEditing(b)}>Manage Pickup</button>
              </>
            )}
          </div>
        ))
      )}
    </DashboardLayout>
  );
}
