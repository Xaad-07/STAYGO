import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

const CUSTOMER_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bookings", label: "My Bookings" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/my-reviews", label: "My Reviews" },
  { to: "/profile", label: "Profile" },
  { to: "/change-password", label: "Change Password" },
];

// Shows the logged-in user's profile (full name, email, phone) with an
// Edit mode for full name and phone. Email is displayed but not editable,
// since it's the account's login identity.
export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await api.get("/profile.php");
      if (res.data.status === "success") {
        setProfile(res.data.user);
        setFullName(res.data.user.full_name);
        setPhone(res.data.user.phone);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneChange(e) {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (fullName.trim().length < 3) {
      setError("Full name must be at least 3 characters long.");
      return;
    }
    if (phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/profile.php", { full_name: fullName, phone });
      if (res.data.status === "success") {
        setProfile({ ...profile, full_name: fullName, phone });
        setSuccess("Profile updated successfully.");
        setEditing(false);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const links = user?.role === "customer" ? CUSTOMER_LINKS : [];

  if (loading) {
    return (
      <DashboardLayout links={links}>
        <p>Loading profile...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout links={links}>
      <h2>Profile</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ maxWidth: 420 }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          {editing ? (
            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          ) : (
            <p>{profile.full_name}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <p>{profile.email}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Phone</label>
          {editing ? (
            <input className="form-input" value={phone} onChange={handlePhoneChange} />
          ) : (
            <p>{profile.phone}</p>
          )}
        </div>

        {editing ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn-link" onClick={() => { setEditing(false); setFullName(profile.full_name); setPhone(profile.phone); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" style={{ maxWidth: 160 }} onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
