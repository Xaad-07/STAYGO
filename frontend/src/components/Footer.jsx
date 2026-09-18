import { Link } from "react-router-dom";

// Global footer. Per spec: keep it very clean, no demo credentials,
// no college info, no fake address/social links.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="footer-logo">StayGo</div>
          <div className="footer-tagline">Find • Book • Stay</div>
        </div>

        <nav className="footer-links">
          <Link to="/properties">Properties</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/contact">Help</Link>
        </nav>

        <nav className="footer-links">
          <span className="footer-static-link">Privacy</span>
          <span className="footer-static-link">Terms</span>
        </nav>
      </div>
      <div className="footer-copyright">© 2026 StayGo</div>
    </footer>
  );
}
