import { useState } from "react";
import api from "../api/axios";

// Small inline review form shown under a completed booking in My Bookings.
// Only rendered when the booking's status is "completed" AND it hasn't
// already been reviewed (the parent tracks that).
export default function ReviewForm({ bookingId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }
    if (comment.trim().length < 5) {
      setError("Please write a comment of at least 5 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/review/create.php", { booking_id: bookingId, rating, comment });
      if (res.data.status === "success") {
        onSubmitted();
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
    <div style={{ marginTop: 10, padding: 12, background: "var(--color-bg-soft)", borderRadius: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Rate your stay</div>

      {error && <div className="alert alert-error" style={{ marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            style={{
              cursor: "pointer",
              fontSize: 22,
              color: star <= rating ? "var(--color-accent)" : "#ccc",
            }}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        className="form-input"
        rows={2}
        placeholder="Share a few words about your stay..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ maxWidth: 160 }}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
