import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Login page for all three roles (customer, host, admin).
// After a successful login we redirect based on the role returned by the backend.
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (email === "" || password === "") {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      // login.php checks the credentials and starts a PHP session (cookie-based).
      const res = await api.post("/auth/login.php", { email, password });

      if (res.data.status === "success") {
        // Save the user in React state so the navbar/dashboard can react immediately.
        login(res.data.user);

        // Send each role to its own dashboard.
        const role = res.data.user.role;
        if (role === "customer") navigate("/dashboard");
        else if (role === "host") navigate("/host/dashboard");
        else if (role === "admin") navigate("/admin/dashboard");
        else navigate("/");
      } else {
        // Generic message from the backend -- we never reveal which field was wrong.
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
        <div className="auth-title">Log in to your account</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-field">
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
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
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Link to="/forgot-password" className="btn-link">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="auth-footer-text">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
