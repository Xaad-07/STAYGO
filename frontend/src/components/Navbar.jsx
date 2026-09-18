import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Global navbar shown on every page. Links change based on login state
// and role, per spec section 6. On mobile, links collapse into a
// hamburger menu instead of a complex nested navigation system.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  // Decide which "home base" link to show for a logged-in user based on role.
  const dashboardLink =
    user?.role === "host" ? "/host/dashboard" : user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          StayGo
        </Link>

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          ☰
        </button>

        <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={closeMenu}>Home</Link>
          <Link to="/properties" onClick={closeMenu}>Properties</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>

          {user ? (
            <>
              {user.role === "customer" && (
                <>
                  <Link to="/wishlist" onClick={closeMenu}>Wishlist</Link>
                  <Link to="/bookings" onClick={closeMenu}>Bookings</Link>
                </>
              )}
              {user.role === "host" && <Link to="/host/dashboard" onClick={closeMenu}>Dashboard</Link>}
              {user.role === "admin" && <Link to="/admin/dashboard" onClick={closeMenu}>Dashboard</Link>}

              <Link to={dashboardLink} onClick={closeMenu} className="navbar-profile-link">
                {user.full_name}
              </Link>
              <button className="navbar-logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="navbar-signup" onClick={closeMenu}>Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
