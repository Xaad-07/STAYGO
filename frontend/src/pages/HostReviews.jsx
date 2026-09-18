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

// Shows every review left across all of this host's properties.
export default function HostReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/review/read.php", { params: { host_view: 1 } });
      if (res.data.status === "success") {
        setReviews(res.data.reviews);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout links={HOST_LINKS}>
      <h2>Reviews</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.review_id} className="review-item">
            <strong>{r.property_title}</strong>
            <div style={{ color: "var(--color-accent)", fontSize: 14 }}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} <span style={{ color: "var(--color-text-light)", fontSize: 12 }}>by {r.customer_name}</span>
            </div>
            <p style={{ margin: "4px 0 0" }}>{r.comment}</p>
          </div>
        ))
      )}
    </DashboardLayout>
  );
}
