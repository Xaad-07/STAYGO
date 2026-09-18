import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

// Registration page for Customers and Hosts.
// Admin accounts cannot be created here (spec section 18).
export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "customer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // -------------------- LIVE VALIDATION HELPERS --------------------

  const isEmailValid = form.email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const passwordRules = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean);

  const confirmMatches =
    form.confirm_password === "" || form.confirm_password === form.password;

  // Only allow numeric input for phone, capped at 10 digits.
  function handlePhoneChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, phone: digitsOnly });
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setServerSuccess("");

    // Final guard before hitting the network -- backend re-validates everything too.
    if (!isEmailValid || form.email === "") {
      setServerError("Please enter a valid email address.");
      return;
    }
    if (form.phone.length !== 10) {
      setServerError("Phone number must be exactly 10 digits.");
      return;
    }
    if (!passwordValid) {
      setServerError("Please satisfy all password requirements.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setServerError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/register.php", form);
      if (res.data.status === "success") {
        setServerSuccess(res.data.message);
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setServerError(res.data.message);
      }
    } catch (err) {
      setServerError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">StayGo</div>
        <div className="auth-tagline">Find • Book • Stay</div>
        <div className="auth-title">Create your account</div>

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {serverSuccess && <div className="alert alert-success">{serverSuccess}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${!isEmailValid ? "invalid" : ""}`}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
            {!isEmailValid && (
              <div className="field-hint error">Enter a valid email address.</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-field">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
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
            <label className="form-label">Confirm Password</label>
            <input
              className={`form-input ${!confirmMatches ? "invalid" : ""}`}
              type={showPassword ? "text" : "password"}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
            />
            {form.confirm_password !== "" && (
              <div className={`field-hint ${confirmMatches ? "success" : "error"}`}>
                {confirmMatches ? "Passwords match" : "Passwords do not match"}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">I want to join as</label>
            <div className="role-toggle">
              <div
                className={`role-option ${form.role === "customer" ? "selected" : ""}`}
                onClick={() => setForm({ ...form, role: "customer" })}
              >
                Customer
              </div>
              <div
                className={`role-option ${form.role === "host" ? "selected" : ""}`}
                onClick={() => setForm({ ...form, role: "host" })}
              >
                Host
              </div>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer-text">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
