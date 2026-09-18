import { useState } from "react";
import api from "../api/axios";

// Public Contact page. Two-column layout: contact info on the left,
// a form on the right that posts to contact.php.
export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Please enter a message of at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/contact.php", form);
      if (res.data.status === "success") {
        setSuccess(res.data.message);
        setForm({ name: "", email: "", message: "" });
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
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px", display: "flex", gap: 40, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 260px" }}>
        <h2>Get in touch</h2>
        <p style={{ color: "var(--color-text-light)" }}>
          Have a question about a booking, a property, or your account? Send us a message
          and we'll get back to you.
        </p>
        <p><strong>Email:</strong> support@staygo.in</p>
        <p><strong>Phone:</strong> +91 5980000008</p>
      </div>

      <div style={{ flex: "1 1 320px" }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-input" name="message" rows={5} value={form.message} onChange={handleChange} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
