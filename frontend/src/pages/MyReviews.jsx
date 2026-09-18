import { useEffect, useState } from "react";
import api from "../api/axios";

// Lists all reviews the logged-in customer has submitted.
export default function MyReviews() {
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
      const res = await api.get("/review/read.php", { params: { mine: 1 } });
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

  if (loading) return <p style={{ textAlign: "center", padding: 40 }}>Loading your reviews...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 20px" }}>
      <h2>My Reviews</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {reviews.length === 0 ? (
        <p>You haven't written any reviews yet. Reviews can be added after a stay is completed.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.review_id} className="review-item">
            <strong>{r.property_title}</strong>
            <div style={{ color: "var(--color-accent)", fontSize: 14 }}>
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </div>
            <p style={{ margin: "4px 0 0" }}>{r.comment}</p>
            <p style={{ fontSize: 12, color: "var(--color-text-light)", margin: "4px 0 0" }}>
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
