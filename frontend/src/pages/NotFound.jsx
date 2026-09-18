import { Link } from "react-router-dom";

// Shown for any URL that doesn't match a real route.
// The project rule is: never show a blank page for an unknown route.
export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1 style={{ fontSize: 64, margin: 0, color: "var(--color-primary)" }}>404</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        Looks like you've taken a wrong turn.
      </p>
      <Link to="/" className="btn btn-primary" style={{ maxWidth: 180, margin: "0 auto" }}>
        Go Home
      </Link>
    </div>
  );
}
