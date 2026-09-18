import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

// Simple forgot-password flow: the user proves account ownership by entering
// the email AND phone number on file, then sets a new password directly.
// No OTP / email service is used, matching the project's "keep it simple" scope.
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    phone: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordRules = {
    length: form.new_password.length >= 8,
    upper: /[A-Z]/.test(form.new_password),
    lower: /[a-z]/.test(form.new_password),
    number: /[0-9]/.test(form.new_password),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean);

  function handlePhoneChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, phone: digitsOnly });
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!passwordValid) {
      setError("Please satisfy all password requirements.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot_password.php", form);
      if (res.data.status === "success") {
        setSuccess(res.data.message);
        setTimeout(() => navigate("/login"), 1500);
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">StayGo</div>
        <div className="auth-tagline">Find • Book • Stay</div>
        <div className="auth-title">Reset your password</div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="10-digit mobile number on file"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="password-field">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Create a new password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <ul className="password-rules">
              <li className={passwordRules.length ? "met" : ""}>
                {passwordRules.length ? "✓" : "○"} Minimum 8 characters
              </li>
              <li className={passwordRules.upper ? "met" : ""}>
                {passwordRules.upper ? "✓" : "○"} One uppercase letter
              </li>
              <li className={passwordRules.lower ? "met" : ""}>
                {passwordRules.lower ? "✓" : "○"} One lowercase letter
              </li>
              <li className={passwordRules.number ? "met" : ""}>
                {passwordRules.number ? "✓" : "○"} One number
              </li>
            </ul>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer-text">
          Remembered your password? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
