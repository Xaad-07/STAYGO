import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shared sidebar layout for Customer, Host and Admin dashboards.
// `links` is an array of { to, label } for this role's sidebar items.
// On mobile, the sidebar collapses into a horizontal scrollable tab bar
// (see .dashboard-sidebar in index.css) instead of a fixed-width column,
// since a 220px sidebar would consume most of a phone screen.
export default function DashboardLayout({ links, children }) {
  const { logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <nav className="dashboard-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `dashboard-nav-link ${isActive ? "active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
          <button className="dashboard-nav-logout" onClick={logout}>
            Logout
          </button>
        </nav>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
