import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/DashboardLayout";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/hosts", label: "Hosts" },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/messages", label: "Contact Messages" },
  { to: "/admin/logs", label: "Activity Logs" },
];

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  function loadReviews() {
    setLoading(true);
    api.get("/admin/reviews.php")
      .then((res) => {
        if (res.data.status === "success") setReviews(res.data.reviews);
        else setError(res.data.message);
      })
      .catch(() => setError("Unable to connect to the server. Please try again."))
      .finally(() => setLoading(false));
  }

  async function confirmDelete(reviewId) {
    try {
      const res = await api.post("/admin/reviews.php", { review_id: reviewId });
      if (res.data.status === "success") {
        setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout links={ADMIN_LINKS}>
      <h2>Reviews</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.review_id} className="review-item">
            <strong>{r.property_title}</strong> · {r.customer_name}
            <div style={{ color: "var(--color-accent)", fontSize: 14 }}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </div>
            <p style={{ margin: "4px 0" }}>{r.comment}</p>
            {deletingId === r.review_id ? (
              <span>
                <span style={{ fontSize: 13, marginRight: 6 }}>Remove this review?</span>
                <button className="btn-link" style={{ color: "var(--color-error)", marginRight: 8 }} onClick={() => confirmDelete(r.review_id)}>
                  Yes, remove
                </button>
                <button className="btn-link" onClick={() => setDeletingId(null)}>Cancel</button>
              </span>
            ) : (
              <button className="btn-link" style={{ color: "var(--color-error)" }} onClick={() => setDeletingId(r.review_id)}>
                Remove Review
              </button>
            )}
          </div>
        ))
      )}
    </DashboardLayout>
  );
}
