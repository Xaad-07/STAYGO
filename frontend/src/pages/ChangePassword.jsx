import { useState } from "react";
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

// Lets a logged-in user change their password. Reuses the same
// validation rules as Register/ForgotPassword for consistency.
export default function ChangePassword() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };
  const passwordValid = Object.values(passwordRules).every(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordValid) {
      setError("Please satisfy all password requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/change_password.php", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (res.data.status === "success") {
        setSuccess(res.data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
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

  return (
    <DashboardLayout links={links}>
      <h2>Change Password</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 400 }}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            className="form-input"
            type={showPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="password-field">
            <input
              className="form-input"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <ul className="password-rules">
            <li className={passwordRules.length ? "met" : ""}>{passwordRules.length ? "✓" : "○"} Minimum 8 characters</li>
            <li className={passwordRules.upper ? "met" : ""}>{passwordRules.upper ? "✓" : "○"} One uppercase letter</li>
            <li className={passwordRules.lower ? "met" : ""}>{passwordRules.lower ? "✓" : "○"} One lowercase letter</li>
            <li className={passwordRules.number ? "met" : ""}>{passwordRules.number ? "✓" : "○"} One number</li>
          </ul>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            className="form-input"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Updating..." : "Change Password"}
        </button>
      </form>
    </DashboardLayout>
  );
}
